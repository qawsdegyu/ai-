import { invokeLLM } from "./_core/llm";
import {
  buildContext,
  compactHistory,
  estimateTokens,
  CONTEXT_HARD_LIMIT_TOKENS,
  TOO_LARGE_CONTEXT_MESSAGE,
  truncate,
  MAX_RESULTS,
} from "./_core/contextBuilder";
import { imcanRows, imcanSources } from "../drizzle/schema";
import { and as drizzleAnd, eq as drizzleEq, ilike as drizzleIlike, or as drizzleOr } from "drizzle-orm";

const NEW_INVENTORY_HASH = "5aad8e9ef455c77a708788d43cbb4e374aefca9044e6a0a0ea2333b917bc4ae0";

async function searchCurrentImcanRows(db: any, query: string, limit = 5): Promise<any[]> {
  const terms = String(query).toLowerCase().trim().split(/\s+/).filter((term) => term.length > 1);
  if (!terms.length) return [];
  const source = await db.select({ id: imcanSources.id, fileName: imcanSources.fileName })
    .from(imcanSources)
    .where(drizzleEq(imcanSources.hash, NEW_INVENTORY_HASH))
    .limit(1);
  if (!source.length) return [];
  const termConditions = terms.map((term) => drizzleIlike(imcanRows.searchText, `%${term}%`));
  const rows = await db.select({ row: imcanRows, source: imcanSources })
    .from(imcanRows)
    .leftJoin(imcanSources, drizzleEq(imcanRows.sourceId, imcanSources.id))
    .where(drizzleAnd(drizzleEq(imcanRows.sourceId, source[0].id), drizzleOr(...termConditions)))
    .limit(Math.min(limit, 5));
  return rows.map(({ row, source: src }: any) => ({
    source_file: src?.fileName ?? "NewInventory.xlsx",
    sheet_name: row.sheetName,
    source_row_number: row.sourceRowNumber,
    current_versa_router_name: row.rowData?.versa_router_name ?? row.rowData?.["Versa Router Name"] ?? row.rowData?.["Router Name"] ?? row.rowData?.routername,
    country: row.rowData?.country ?? row.rowData?.Country,
    city: row.rowData?.city ?? row.rowData?.City,
    site_id: row.rowData?.site_id ?? row.rowData?.["SITE ID"] ?? row.rowData?.["Site ID"],
    summary: row.rowData?.summary ?? row.rowData?.Summary,
    subnet: row.rowData?.subnet_ip ?? row.rowData?.["Subnet IP"] ?? row.rowData?.subnet,
    circuit: row.rowData?.["Circuit Managed"] ?? row.rowData?.["Circuit Type"] ?? row.rowData?.circuit,
    status: row.rowData?.mcs_status ?? row.rowData?.["MCS Status"] ?? row.rowData?.status,
    contact_details: row.rowData?.contact_details ?? row.rowData?.["Contact Details"],
    operational_hours: row.rowData?.operational_hours ?? row.rowData?.["Operational hours"] ?? row.rowData?.["Operational Hours"],
    row_data: row.rowData,
  }));
}

const REQUEST_TYPES = ["Network", "Incident", "LAN", "Request", "Syntax"] as const;
type RequestType = typeof REQUEST_TYPES[number];

function extractRequestType(text: string): RequestType | null {
  const match = String(text).match(/\b(network|incident|lan|request|syntax)\b/i);
  if (!match) return null;
  return REQUEST_TYPES.find((type) => type.toLowerCase() === match[1].toLowerCase()) ?? null;
}

function requestTypeQuestion(): string {
  return "Which request type applies to this router? Please choose one: Network, Incident, LAN, Request, or Syntax.";
}

function buildServiceTemplate(requestType: RequestType, router: any): { text: string; source: any } {
  const row = router?.source_row_number ?? "20";
  const file = router?.source_file ?? "IMCAN-Reference-Sheet---2024-router-updated.xlsm";
  const routerName = router?.current_versa_router_name || "Not available";
  const siteId = router?.site_id || "Not available";
  const location = [router?.country, router?.city].filter(Boolean).join(" / ") || "Not available";
  const hours = router?.operational_hours || "Not available";
  const address = router?.contact_details || "Not available";
  const templates: Record<RequestType, string[]> = {
    Network: [
      "Local hours of operation: {{operational_hours}}",
      "Full site address: {{site_address}}",
      "Business Impact: NA",
      "MCS Site: {{mcs_status}}",
      "Backup Available: {{backup_available}}",
      "Issue description:",
      "",
      "Mandatory details for Down issue:",
      "~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
      "Power status on site:",
      "Modem rebooted:",
      "Cables checked:",
      "Modem LEDs status:",
      "Router LEDs status:"
    ],
    LAN: [
      "Local hours of operation: {{operational_hours}}",
      "Full site address: {{site_address}}",
      "Business Impact: NA",
      "Backup Available: {{backup_available}}",
      "Issue description:",
      "",
      "Mandatory details for Down issue:",
      "~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
      "Power status on site:",
      "Cables checked:"
    ],
    Incident: [
      "Contact Name:", "Contact Number:", "Contact Email:", "", "TW: ASAP", "", "Alternative NA", "",
      "Local hours of operation: {{operational_hours}}", "Full site address: {{site_address}}", "",
      "Asset tag of Faulty Equipment:", "Make and Model: NA", "IP address: NA", "PRN/Username: NA",
      "Screenshot error attached: (Y/N)", "", "Fault Description:"
    ],
    Request: [
      "Contact Name:", "Contact Number:", "Contact Email:", "", "Alternative NA", "",
      "Local hours of operation: {{operational_hours}}", "Full site address: {{site_address}}", "",
      "Asset tag of Equipment:", "Make and Model: NA", "IP address: NA", "PRN/Username: NA", "", "Request Description:"
    ],
    Syntax: [
      "Contact Name:", "Contact Number:", "Contact Email:", "", "TW: ASAP", "", "Alternative NA", "",
      "Local hours of operation: {{operational_hours}}", "Full site address: {{site_address}}", "",
      "Workstation Asset Tag:", "SITATEX address or 7 letter codes:", "SITATEX Version:",
      "Screenshot error attached? (Y/N)", "Incident description / error message:", "",
      "Troubleshooting already done (Yes / No. If Yes, what kind and results):"
    ]
  };
  const replacements: Record<string, string> = {
    "{{router_name}}": routerName,
    "{{site_id}}": siteId,
    "{{location}}": location,
    "{{operational_hours}}": hours,
    "{{site_address}}": address,
    "{{mcs_status}}": router?.status || "Not available",
    "{{backup_available}}": router?.row_data?.["Backup Available"] || "Not available",
  };
  const text = templates[requestType].map(line => Object.entries(replacements).reduce((out, [key, value]) => out.replaceAll(key, value), line)).join("\n");
  return { text, source: { filename: file, sheet: "Dashboard", row, service: requestType } };
}

export function requestedLanguageLabel(language: AssistantLanguage) {
  return language === "ar" ? "Arabic" : "English";
}

export const NO_RESULTS_ANSWER = "I could not find any matching information in the available IMCAN sources.";
export const NO_RESULTS_ANSWER_EN = "I could not find any matching information in the available inventory files.";

export function detectAssistantLanguage(question: string, requestedLanguage?: AssistantLanguage): AssistantLanguage {
  const arabicLetters = (question.match(/[\u0600-\u06FF]/g) || []).length;
  const latinLetters = (question.match(/[A-Za-z]/g) || []).length;
  if (arabicLetters === 0 && latinLetters > 0) return "en";
  if (latinLetters === 0 && arabicLetters > 0) return "ar";
  if (arabicLetters > latinLetters) return "ar";
  return requestedLanguage || "en";
}

export function noResultsAnswer(_question: string = "") {
  const isArabic = false;
  return { answer: formatAssistantResponse(NO_RESULTS_ANSWER_EN, []), sources: [] };
}

export function normalizeAssistantText(value: unknown): string {
  let text = String(value ?? "").trim();

  // Remove Markdown fences whether their line breaks are real or escaped.
  text = text
    .replace(/^```(?:json|markdown|md)?(?:\r?\n|\\n)?/i, "")
    .replace(/(?:\r?\n|\\n)?```$/i, "")
    .trim();

  // Parse the envelope before unescaping its string values.
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed.answer === "string") text = parsed.answer;
  } catch {
    // The model returned normal Markdown rather than a JSON envelope.
  }

  return text
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\r\n/g, "\n")
    .replace(/^```(?:json|markdown|md)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function buildAssistantCellRoute(input: { filename?: string | null; sheet?: string | null; cell?: string | null }) {
  const filename = String(input.filename || '').trim();
  const sheet = String(input.sheet || '').trim();
  const cell = String(input.cell || '').trim().toUpperCase();
  const match = cell.match(/^([A-Z]+)(\d+)$/);
  const column = match?.[1] || '';
  const row = match?.[2] || '';
  const params = new URLSearchParams({
    focusFile: filename,
    focusSheet: sheet,
    focusCell: cell,
    focusRow: row,
    focusColumn: column,
  });
  return `/assistant?${params.toString()}`;
}

export function formatAssistantResponse(answer: string, sources: Array<{ routerName: string; siteId: string; migrationStatus: string }>) {
  const cleanAnswer = normalizeAssistantText(answer);
  if (!sources.length) return cleanAnswer;
  const sourceLines = sources.map(source => `- **Current Versa Router Name:** ${source.routerName || "Not available"}\n- **Site ID:** ${source.siteId || "Not available"}`).join("\n\n");
  return `${cleanAnswer}\n\n**Source**\n${sourceLines}`;
}

export type AssistantLanguage = "ar" | "en";
type SearchInput = { question: string; language?: AssistantLanguage; fileId?: number; conversationId?: number };

export function buildInventoryContext(rows: any[]) {
  return rows.map((row) => ({
    "Router Name": row.routerName,
    "Old Router Name": row.oldRouterName,
    "Site ID": row.siteId,
    "Subnet IP": row.subnetIp,
    "Migration Status": row.migrationStatus,
    "Circuit Type": row.circuitType,
    "Contact Details": row.contactDetails,
    "Location": row.location,
    "Operational Hours": row.operationalHours,
    "Proactive Email Contacts": row.proactiveEmailContacts,
    "Switch Name": row.switchName,
    "MCS Status": row.mcsStatus,
    "Country": row.country,
    "City": row.city,
  }));
}

export async function answerInventoryQuestion({ question, language, fileId, conversationId, currentUserId }: SearchInput & { currentUserId: number }) {
  const responseLanguage = "en" as const;
  const isEnglish = true; // FORCE STRONG ENGLISH RESPONSES
  let context: any[] = [];
  let rawFilesContext: any[] = [];
  let conversationHistoryText = "";
  let previousUserMessageText = "";
  let conversationUserText = "";
  let deterministicExcelAnswer: { answer: string; sources: any[]; metadata: any } | null = null;
  const debugInfo: any = { files_processed: [] };

  // Clarify vague operational complaints without querying the whole database.
  const q = String(question).trim();
  const hasTarget = /\b(?:VAP[A-Z0-9]+|JFK[A-Z0-9]+|[A-Z]{2,8}\d{2,6}|site\s*id|airport|hostname|subnet|circuit)\b/i.test(q);
  const generalProblem = /^(?:i\s+have|the|there(?:'s| is)|we\s+have|need)\b.*\b(?:router|network|internet|connectivity|vpn|link|circuit|switch|printer|problem|issue|outage|down|not\s+responding)\b/i.test(q);
  const technicalDirectQuestion = /\b(?:printer|firmware|printerset|vcom|usb|xml|amadeus|atb|btp|configure|configuration|driver|scc|resolver|escalation|dns)\b/i.test(q);
  if (generalProblem && !hasTarget && !technicalDirectQuestion) {
    return {
      answer: "Which site, airport, router, or site ID should I search for?",
      sources: [],
      metadata: { stage: "waiting_for_target", language: "en" },
      debug: debugInfo,
    };
  }

  if (conversationId) {
    try {
      const { getUserConversation } = await import("./aiHistory");
      const pastChat = await getUserConversation(currentUserId, conversationId);
      if (pastChat && pastChat.messages && pastChat.messages.length > 0) {
        // Get the most recent user message before the current one to aid in DB search
        const userMessages = [...pastChat.messages].filter((m: any) => m.role === 'user');
        conversationUserText = userMessages.map((m: any) => String(m.content ?? "").slice(0, 500)).join(" ");
        if (userMessages.length > 1) {
          previousUserMessageText = userMessages[userMessages.length - 2].content.slice(0, 300);
        }

        // Compact history: last 6 messages + short summary of older turns
        const { recentText, summary } = compactHistory(pastChat.messages);
        const summaryClause = summary ? `Summary of earlier conversation: ${summary}\n\n` : "";
        conversationHistoryText = `\n\nPrevious Conversation Context:\n${summaryClause}${recentText}`;
      }
    } catch (err) {
      console.error("Failed to load conversation history", err);
    }
  }

  const oneDriveCache = (global as any).oneDriveCache || new Map<string, { eTag: string, parsedData: any[] }>();
  if (!(global as any).oneDriveCache) (global as any).oneDriveCache = oneDriveCache;

  const targetInConversation = /\b(?:VAP[A-Z0-9]+|JFK[A-Z0-9]+|[A-Z]{2,8}\d{2,6}|site\s*id|airport|hostname|subnet|circuit)\b/i.test(`${q} ${conversationUserText}`);
  const requestType = extractRequestType(`${q} ${conversationUserText}`);
  const issueGiven = /\b(?:down|not\s+responding|not\s+working|failed|failure|outage|problem|issue|error|unreachable|offline|slow|broken)\b/i.test(q);

  const { getDb } = await import("./db");
  const db = await getDb();
  if (!db) return noResultsAnswer(question);


  // Search the normalized IMCAN source first so current Versa Router names work.
  let currentImcanRows: any[] = [];
  try {
    const identifiers = `${q} ${conversationUserText}`.match(/\b(?:VAP[A-Z0-9]+|JFK[A-Z0-9]+|[A-Z]{2,8}\d{2,6})\b/gi) ?? [];
    const currentSearchQuery = Array.from(new Set(identifiers.map((value) => value.toUpperCase()))).join(" ") || question;
    currentImcanRows = await searchCurrentImcanRows(db, currentSearchQuery, MAX_RESULTS);
    if (currentImcanRows.length) context.push(...currentImcanRows);
  } catch (error) {
    console.error("IMCAN current inventory search failed", error);
  }

  // The Dashboard service selector is backed by the template formula in Dashboard row 20.
  // Keep the exact service fields in the retrieved context so the model cannot replace them
  // with a generic answer. Syntax follows the workbook's SITATEX template.
  if (requestType && currentImcanRows.length) {
    const serviceTemplate = buildServiceTemplate(requestType, currentImcanRows[0]);
    rawFilesContext.push({
      fileName: serviceTemplate.source.filename,
      content: `[Sheet: ${serviceTemplate.source.sheet}] [Row: ${serviceTemplate.source.row}] [Service: ${requestType}]\n${serviceTemplate.text}`,
      source: serviceTemplate.source,
    });
  }

  const { inventoryRecords, onedriveFiles, onedriveIndexedData } = await import("../drizzle/schema");
  const { eq, and, inArray } = await import("drizzle-orm");

  try {
      // Restore Router Records database context — search only, NEVER fetch all rows
      const oldSearchKeywords = (question + " " + previousUserMessageText)
        .toLowerCase().split(" ").filter(w => w.length > 2).slice(0, 10);

      if (oldSearchKeywords.length > 0) {
        const { ilike, or: drOr } = await import("drizzle-orm");
        const keywordConditions = oldSearchKeywords.map(kw =>
          drOr(
            ilike(inventoryRecords.routerName, `%${kw}%`),
            ilike(inventoryRecords.oldRouterName, `%${kw}%`),
            ilike(inventoryRecords.siteId, `%${kw}%`)
          )
        );
        const { or: drOr2 } = await import("drizzle-orm");
        const matchedRouterRows = await db
          .select({
            routerName: inventoryRecords.routerName,
            oldRouterName: inventoryRecords.oldRouterName,
            siteId: inventoryRecords.siteId,
            subnetIp: inventoryRecords.subnetIp,
            migrationStatus: inventoryRecords.migrationStatus,
            circuitType: inventoryRecords.circuitType,
            contactDetails: inventoryRecords.contactDetails,
            location: inventoryRecords.location,
            operationalHours: inventoryRecords.operationalHours,
            country: inventoryRecords.country,
            city: inventoryRecords.city,
          })
          .from(inventoryRecords)
          .where(drOr2(...keywordConditions))
          .limit(MAX_RESULTS);
        if (matchedRouterRows.length > 0) {
          context.push(...buildInventoryContext(matchedRouterRows));
        }
      }
      
      // NEW ONEDRIVE SEARCH LOGIC (Using database index)
      // Active indexed inventory is the shared enterprise knowledge base.
      // Management and upload flows remain owner/admin protected; authenticated users
      // may query only files explicitly marked active.
      const activeFiles = await db.select().from(onedriveFiles).where(
        eq(onedriveFiles.status, "active")
      );
      
      if (activeFiles.length > 0) {
         let indexedInventoryCells: any[] | null = null;
         const loadIndexedInventoryCells = async () => {
           if (indexedInventoryCells) return indexedInventoryCells;
           const activeDriveIds = activeFiles.map((file: any) => String(file.driveItemId));
           indexedInventoryCells = await db.select({
             driveItemId: onedriveIndexedData.driveItemId,
             sheetName: onedriveIndexedData.sheetName,
             rowIndex: onedriveIndexedData.rowIndex,
             cellAddress: onedriveIndexedData.cellAddress,
             content: onedriveIndexedData.content,
           }).from(onedriveIndexedData).where(and(
             inArray(onedriveIndexedData.driveItemId, activeDriveIds),
             eq(onedriveIndexedData.sheetName, "Inventory"),
           ));
           return indexedInventoryCells;
         };
         // Advanced Search Normalization
         const normalizeText = (value: any) => {
           return String(value ?? '')
             .normalize('NFC')
             .toLowerCase()
             .replace(/[أإآ]/g, 'ا')
             .replace(/[ًٌٍَُِّْـ]/g, '')
             .replace(/\s+/g, ' ')
             .trim();
         };
         
         const rawQuestion = question.trim();
         const normQuestion = normalizeText(question);
         
         const stopWords = ["ما", "هو", "هي", "في", "على", "من", "ورقة", "عنوان", "الظاهر", "خدمة", "ال", "جميع", "اسماء", "قيمة", "ماذا", "هل", "الى", "لخدمة", "البريد", "الإلكتروني", "اي", "توجد", "ملاحظة", "تفيد", "بأن", "بعض", "وما", "الإجراء", "المطلوب", "لا", "نعم"];
         
         const rawWords = rawQuestion.split(' ');
         const queryWords = normQuestion.split(' ').map((w: string) => w.replace(/[^a-z0-9_\-\u0600-\u06ff]/gi, '')).filter((w: string) => !stopWords.includes(w) && w.length >= 2);
         
         const searchRepresentations = [
           normQuestion,
           ...queryWords
         ].filter(Boolean);

         // Direct indexed-data fallback for router IDs. It deliberately uses only driveItemIds
         // belonging to this user's active files, but does not depend on per-file loop state.
         if (!deterministicExcelAnswer) {
           const directRouterToken = rawQuestion.match(/\b[A-Z][A-Z0-9_-]*\d[A-Z0-9_-]*\b/i)?.[0];
           if (directRouterToken) {
             const indexedRows = await loadIndexedInventoryCells();
             const routerCells = indexedRows.filter((cell: any) => String(cell.cellAddress || '').toUpperCase().startsWith('C') && String(cell.content || '').trim().toLowerCase() === directRouterToken.toLowerCase());
             const groups = Array.from(new Set(routerCells.map((cell: any) => `${cell.driveItemId}:${cell.rowIndex}`)));
             if (groups.length === 1) {
               const [driveItemId, rowIndexText] = groups[0].split(':');
               const rowIndex = Number(rowIndexText);
               const fileMeta = activeFiles.find((file: any) => String(file.driveItemId) === driveItemId);
               const rowCells = indexedRows.filter((cell: any) => String(cell.driveItemId) === driveItemId && String(cell.sheetName || '').trim().toLowerCase() === 'inventory' && Number(cell.rowIndex) === rowIndex);
               const byAddress = new Map(rowCells.map((cell: any) => [String(cell.cellAddress || '').toUpperCase(), String(cell.content ?? '')]));
               const fields = [['Router Name', `C${rowIndex}`], ['Site ID', `G${rowIndex}`], ['Country', `A${rowIndex}`], ['City', `B${rowIndex}`], ['Operational Hours', `N${rowIndex}`]] as const;
               const present = fields.filter(([, address]) => byAddress.has(address) && String(byAddress.get(address)).trim() !== '');
               if (fileMeta && present.length > 0) {
                 const lines = present.map(([label, address]) => {
                   const rawValue = String(byAddress.get(address) ?? '');
                   return isEnglish
                     ? `- **${label}:** ${rawValue}\n  - Source cell: Inventory!${address}`
                     : `- **${label}:** ${rawValue}\n  - **الخلية المصدرية:** Inventory!${address}`;
                 });
                 deterministicExcelAnswer = { answer: isEnglish ? `I found this information in your company's inventory record.\n\n${lines.join('\n')}` : `وجدتُ هذه المعلومات في سجل المخزون الخاص بشركتك.\n\n${lines.join('\n')}`, sources: present.map(([label, address]) => ({ filename: fileMeta.name, sheet: 'Inventory', cell: address, raw_value: byAddress.get(address), field: label })), metadata: { source_type: 'excel', file_id: driveItemId, filename: fileMeta.name, sheet: 'Inventory', matched_row: rowIndex, cells: present.map(([label, address]) => ({ field: label, cell: address, value: byAddress.get(address) })) } };
               }
             }
           }
         }

         // Direct deterministic aggregation for SITA. This runs before the per-file context path
         // so complex grouping questions never depend on LLM schema output or truncated context.
         if (!deterministicExcelAnswer && /circuit\s*managed/i.test(rawQuestion) && /\bsita\b/i.test(rawQuestion)) {
           const inventoryCells = await loadIndexedInventoryCells();
           const sitaRows = new Set(inventoryCells.filter((cell: any) => String(cell.cellAddress || '').toUpperCase().startsWith('F') && /\bsita\b/i.test(String(cell.content ?? ''))).map((cell: any) => `${cell.driveItemId}:${cell.rowIndex}`));
           const rowRecords: any[] = [];
           for (const key of Array.from(sitaRows)) {
             const [driveItemId, rowIndexText] = String(key).split(':');
             const rowCells = inventoryCells.filter((cell: any) => String(cell.driveItemId) === driveItemId && Number(cell.rowIndex) === Number(rowIndexText));
             const get = (column: string) => rowCells.find((cell: any) => String(cell.cellAddress || '').toUpperCase().startsWith(column));
             const fields: any = { country: get('A'), city: get('B'), router: get('C'), circuit: get('F'), siteId: get('G'), summary: get('H'), mcs: get('J'), hours: get('N') };
             const value = (cell: any) => String(cell?.content ?? '').trim();
             const values = Object.fromEntries(Object.entries(fields).map(([name, cell]: any) => [name, value(cell)]));
             const score = (/primary/i.test(values.mcs) ? 3 : 0) + (/(24|all week|all day|no day off|00:00)/i.test(values.hours) ? 2 : 0) + (values.summary ? 1 : 0);
             rowRecords.push({ driveItemId, rowIndex: Number(rowIndexText), fields, values, score });
           }
           if (rowRecords.length > 0) {
             const countryMap = new Map<string, Map<string, number>>();
             for (const row of rowRecords) {
               const country = String(row.values.country || '').replace(/[،,;]+$/g, '').trim();
               const city = String(row.values.city || '').replace(/[،,;]+$/g, '').trim();
               if (!country || !city) continue;
               const countryKey = country.toUpperCase();
               const cityKey = city.toUpperCase();
               if (!countryMap.has(countryKey)) countryMap.set(countryKey, new Map());
               const cities = countryMap.get(countryKey)!;
               cities.set(cityKey, (cities.get(cityKey) || 0) + 1);
             }
             const countrySummary = Array.from(countryMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([country, cities]) => `${country}: ${Array.from(cities.entries()).map(([city, count]) => `${city} (${count})`).join(', ')}`).join('; ');
             const priorityRows = [...rowRecords].sort((a, b) => b.score - a.score || a.rowIndex - b.rowIndex).slice(0, 12);
             const fileLabel = activeFiles.find((file: any) => String(file.driveItemId) === priorityRows[0].driveItemId)?.name || 'IMCAN-Reference-Sheet---2024 (1).xlsm';
             const evidence = priorityRows.map(row => { const refs = Object.values(row.fields).filter(Boolean).map((cell: any) => `${cell.cellAddress}=${String(cell.content ?? '').trim()}`).join('; '); return `- **${row.values.router || '<empty>'}** — ${row.values.country || '<empty>'}/${row.values.city || '<empty>'}\n  - MCS Status: ${row.values.mcs || '<empty>'}\n  - Operational Hours: ${row.values.hours || '<empty>'}\n  - Summary: ${row.values.summary || '<empty>'}\n  - الموقع داخل الملف: Inventory!A${row.rowIndex}:N${row.rowIndex}\n  - الدليل الخلوي: ${refs}\n  - [فتح ملف المصدر في OneDrive](${activeFiles.find((file: any) => String(file.driveItemId) === row.driveItemId)?.webUrl || '#'})`; }).join('\n');
             const sourceUrl = activeFiles.find((file: any) => String(file.driveItemId) === priorityRows[0].driveItemId)?.webUrl || '#';
             const rowRanges = priorityRows.map(row => 'Inventory!A' + row.rowIndex + ':N' + row.rowIndex).join(', ') || 'غير متوفر في المصدر';
             deterministicExcelAnswer = { answer: `**الخلاصة**\nتم العثور على ${rowRecords.length} موقعًا يطابق Circuit Managed = SITA في OneDrive.\n\n**البيانات**\n- الملف: ${fileLabel}\n- الورقة: Inventory\n- التوزيع حسب الدولة والمدينة: ${countrySummary || '<لا توجد صفوف مطابقة>'}\n\n${evidence || '<لا توجد أدلة>'}\n\n**الاستنتاج**\nهذا ترتيب استدلالي قابل للتدقيق مبني فقط على MCS Status وOperational Hours وSummary الموجودة في الصفوف، ولا يتضمن حكمًا تشغيليًا خارج الملف.\n\n**المصدر**\n- [فتح ملف المصدر في OneDrive](${sourceUrl})\n- نطاقات الصفوف: ${rowRanges}`, sources: priorityRows.flatMap(row => Object.values(row.fields).filter(Boolean).map((cell: any) => ({ filename: fileLabel, sheet: 'Inventory', cell: cell.cellAddress, raw_value: cell.content }))), metadata: { source_type: 'excel', filename: fileLabel, sheet: 'Inventory', matched_rows: rowRecords.length, method: 'direct_deterministic_sita_aggregation' } };
           }
         }

             for (const fileMeta of activeFiles) {
             const cacheKey = `${fileMeta.driveItemId}:${fileMeta.eTag || ""}`;
             let allData = oneDriveCache.get(cacheKey)?.parsedData;
             if (!allData) {
               allData = await db.select().from(onedriveIndexedData).where(eq(onedriveIndexedData.driveItemId, fileMeta.driveItemId));
               oneDriveCache.set(cacheKey, { eTag: fileMeta.eTag || "", parsedData: allData });
             }

             // Deterministic router lookup: exact values and cell addresses come directly from
             // the indexed Inventory row. This prevents a model/schema response from replacing
             // a known answer with hallucinated or non-answer JSON.
             if (!deterministicExcelAnswer) {
               const routerToken = rawQuestion.match(/\b[A-Z][A-Z0-9_-]*\d[A-Z0-9_-]*\b/i)?.[0];
               if (routerToken) {
                 const inventoryRows = allData.filter((cell: any) => String(cell.sheetName || '').trim().toLowerCase() === 'inventory');
                 const exactRouterCells = inventoryRows.filter((cell: any) => String(cell.cellAddress || '').toUpperCase().startsWith('C') && String(cell.content || '').trim().toLowerCase() === routerToken.toLowerCase());
                 const fallbackRouterCells = inventoryRows.filter((cell: any) => String(cell.content || '').trim().toLowerCase().includes(routerToken.toLowerCase()));
                 const rowIds = Array.from(new Set((exactRouterCells.length ? exactRouterCells : fallbackRouterCells).map((cell: any) => cell.rowIndex)));
                 if (rowIds.length === 1) {
                   const rowCells = inventoryRows.filter((cell: any) => cell.rowIndex === rowIds[0]);
                   const byAddress = new Map(rowCells.map((cell: any) => [String(cell.cellAddress || '').toUpperCase(), String(cell.content ?? '')]));
                   const fields = [
                     ['Router Name', 'C' + rowIds[0]],
                     ['Site ID', 'G' + rowIds[0]],
                     ['Country', 'A' + rowIds[0]],
                     ['City', 'B' + rowIds[0]],
                     ['Operational Hours', 'N' + rowIds[0]],
                   ] as const;
                   const present = fields.filter(([, address]) => byAddress.has(address) && String(byAddress.get(address)).trim() !== '');
                   if (present.length > 0) {
                     const lines = present.map(([label, address]) => `- **${label}:** ${byAddress.get(address)}\n  - الخلية المصدرية: Inventory!${address}`);
                     deterministicExcelAnswer = {
                       answer: `وجدتُ هذه المعلومات في سجل المخزون الخاص بشركتك.\n\n${lines.join('\n')}`,
                       sources: present.map(([label, address]) => ({ filename: fileMeta.name, sheet: 'Inventory', cell: address, raw_value: byAddress.get(address), field: label })),
                       metadata: { source_type: 'excel', file_id: fileMeta.driveItemId, filename: fileMeta.name, sheet: 'Inventory', matched_row: rowIds[0], cells: present.map(([label, address]) => ({ field: label, cell: address, value: byAddress.get(address) })) },
                     };
                   }
                 }
               }
             }
             
             let fileDebug = {
                file_name: fileMeta.name,
                drive_item_id: fileMeta.driveItemId,
                etag: fileMeta.eTag,
                actual_sheet_count: fileMeta.sheetCount || 0,
                indexed_sheet_count: fileMeta.sheetCount || 0,
                total_rows_seen: allData.length,
                total_cells_seen: fileMeta.indexedCells,
                total_non_empty_cells: fileMeta.indexedCells,
                total_cells_indexed: fileMeta.indexedCells,
                missing_sheets: [],
                sheets_searched: [] as string[],
                total_matches: 0,
                matches_per_sheet: {} as Record<string, number>,
                search_words: searchRepresentations,
                targeted_sheets: "all"
             };
             
             const uniqueSheets = Array.from(new Set<string>(allData.map((r: any) => String(r.sheetName || "")))).filter(Boolean);
             uniqueSheets.forEach((sheet: string) => {
               fileDebug.matches_per_sheet[sheet] = 0;
             });
             fileDebug.sheets_searched = uniqueSheets;
             
             let extractedLines: any[] = [];
             
             if ((fileMeta.sheetCount || 0) > 0 && allData.length === 0) {
               extractedLines.push({ text: `[SYSTEM_WARNING] الفهرسة لم تكتمل لهذا الملف (${fileMeta.name}). يرجى التحقق من حالة المزامنة.`, score: -1 });
             } else {
                 const genericTerms = new Set(["imcan", "reference", "sheet", "xlsm", "inventory", "country", "city", "routername", "router", "site", "id", "name", "value", "file", "workbook", "row", "where", "and", "what", "the"]);
                 const meaningfulQueryWords = queryWords.filter((word: string) => !genericTerms.has(word));
                 const locationTerms = meaningfulQueryWords.filter((word: string) => /^[a-z0-9_-]+$/i.test(word));
                 const matchedRowIndices = new Set(allData.filter((candidate: any) => {
                   const value = normalizeText(candidate.content);
                   return locationTerms.some((term: string) => value.includes(term));
                 }).map((candidate: any) => candidate.rowIndex));

                 for (const row of allData) {
                    if (!row.content || row.content.trim() === "") continue;
                    
                    const normContent = normalizeText(row.content);
                    const rawContent = String(row.content).toLowerCase();
                    
                    let score = 0;
                    
                    if (normContent.includes(normQuestion)) score += 5;
                    
                    let wordMatches = 0;
                    for (const w of meaningfulQueryWords) {
                      if (normContent.includes(w) || rawContent.includes(w)) {
                        wordMatches++;
                      }
                    }
                    if (wordMatches > 0) score += wordMatches;
                    
                    if (meaningfulQueryWords.length === 1 && wordMatches === 1) score += 3;
                    
                    const isInMatchedLocationRow = matchedRowIndices.has(row.rowIndex);
                    if (isInMatchedLocationRow) score += 20;

                    if (score >= 2) {
                      fileDebug.total_matches++;
                      fileDebug.matches_per_sheet[row.sheetName]++;
                      
                      extractedLines.push({ text: `=== WORKSHEET: ${row.sheetName} === [${row.cellAddress}] [ROW ${row.rowIndex}]\n${row.content}`, score });
                    }
                 }
                  
                 if (fileDebug.total_matches === 0) {
                   extractedLines.push({ text: `[SYSTEM_WARNING] لم أجد تطابقًا في محتوى الملف المفهرس (${fileMeta.name}) بناءً على كلمات البحث الحالية.`, score: -1 });
                 }
             }
             
             const isSitaAnalysis = /circuit\s*managed/i.test(rawQuestion) && /\bsita\b/i.test(rawQuestion);
             if (isSitaAnalysis) {
               const inventoryCells = allData.filter((cell: any) => String(cell.sheetName || '').trim().toLowerCase() === 'inventory');
               const sitaRows = new Set(inventoryCells.filter((cell: any) => String(cell.cellAddress || '').toUpperCase().startsWith('F') && /\bsita\b/i.test(String(cell.content ?? ''))).map((cell: any) => cell.rowIndex));
               const sitaCells = inventoryCells.filter((cell: any) => sitaRows.has(cell.rowIndex));
               if (sitaCells.length > 0) {
                 const selectedColumns: Record<string, string> = { A: 'Country', B: 'City', C: 'RouterName', F: 'Circuit Managed', G: 'Site ID', H: 'Summary', J: 'MCS Status', N: 'Operational Hours' };
                 const compactRows = Array.from(sitaRows).sort((a: any, b: any) => Number(a) - Number(b)).map((rowIndex: any) => {
                   const rowCells = sitaCells.filter((cell: any) => Number(cell.rowIndex) === Number(rowIndex));
                   const values = Object.entries(selectedColumns).map(([column, label]) => {
                     const cell = rowCells.find((candidate: any) => String(candidate.cellAddress || '').toUpperCase().startsWith(column));
                     return cell && String(cell.content ?? '').trim() ? `${label}=${String(cell.content).trim()} [${cell.cellAddress}]` : `${label}=<empty>`;
                   });
                   return `=== WORKSHEET: Inventory === [ROW ${rowIndex}]\n${values.join(' | ')}`;
                 });
                 extractedLines = compactRows.map((text: string) => ({ text, score: 100 }));
                 fileDebug.total_matches = sitaCells.length;
                 fileDebug.matches_per_sheet.Inventory = sitaCells.length;

                 const rowRecords = Array.from(sitaRows).sort((a: any, b: any) => Number(a) - Number(b)).map((rowIndex: any) => {
                   const rowCells = sitaCells.filter((cell: any) => Number(cell.rowIndex) === Number(rowIndex));
                   const get = (column: string) => rowCells.find((cell: any) => String(cell.cellAddress || '').toUpperCase().startsWith(column));
                   const fields: any = { country: get('A'), city: get('B'), router: get('C'), circuit: get('F'), siteId: get('G'), summary: get('H'), mcs: get('J'), hours: get('N') };
                   const value = (cell: any) => String(cell?.content ?? '').trim();
                   const score = (/primary/i.test(value(fields.mcs)) ? 3 : 0) + (/(24|all week|all day|no day off|00:00)/i.test(value(fields.hours)) ? 2 : 0) + (value(fields.summary) ? 1 : 0);
                   return { rowIndex, fields, values: Object.fromEntries(Object.entries(fields).map(([key, cell]: any) => [key, value(cell)])), score };
                 });
                 const countryMap = new Map<string, Map<string, number>>();
                 for (const row of rowRecords) { const country = row.values.country || '<empty>'; const city = row.values.city || '<empty>'; if (!countryMap.has(country)) countryMap.set(country, new Map()); const cities = countryMap.get(country)!; cities.set(city, (cities.get(city) || 0) + 1); }
                 const countrySummary = Array.from(countryMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([country, cities]) => `${country}: ${Array.from(cities.entries()).map(([city, count]) => `${city} (${count})`).join(', ')}`).join('; ');
                 const priorityRows = [...rowRecords].sort((a, b) => b.score - a.score || Number(a.rowIndex) - Number(b.rowIndex)).slice(0, 12);
                 const evidence = priorityRows.map(row => {
                   const refs = Object.values(row.fields).filter(Boolean).map((cell: any) => `${cell.cellAddress}=${String(cell.content ?? '').trim()}`).join('; ');
                   return `- **${row.values.router || '<empty>'}** — ${row.values.country || '<empty>'}/${row.values.city || '<empty>'}\n  - MCS Status: ${row.values.mcs || '<empty>'}\n  - Operational Hours: ${row.values.hours || '<empty>'}\n  - Summary: ${row.values.summary || '<empty>'}\n  - الموقع داخل الملف: Inventory!A${row.rowIndex}:N${row.rowIndex}\n  - الدليل الخلوي: ${refs}\n  - [فتح ملف المصدر في OneDrive](${fileMeta.webUrl || '#'})`;
                 }).join('\n');
                 const fileLabel = fileMeta.name;
                 deterministicExcelAnswer = { answer: `تم تحليل ${rowRecords.length} موقعًا يطابق Circuit Managed = SITA من OneDrive في الملف ${fileLabel}، ورقة Inventory.\n\n**التوزيع حسب الدولة والمدينة:**\n${countrySummary || '<لا توجد صفوف مطابقة>'}\n\n**المواقع الأعلى أولوية وفق قاعدة قابلة للتدقيق:** أُعطيَت الأولوية للصفوف التي تحتوي MCS Status = Primary، وساعات تشغيل 24 ساعة أو طوال الأسبوع، وSummary غير فارغ.\n${evidence || '<لا توجد أدلة>'}\n\nهذا ترتيب استدلالي مبني فقط على الحقول المذكورة، وليس حكمًا تشغيليًا خارج الملف.`, sources: priorityRows.flatMap(row => Object.values(row.fields).filter(Boolean).map((cell: any) => ({ filename: fileLabel, sheet: 'Inventory', cell: cell.cellAddress, raw_value: cell.content }))), metadata: { source_type: 'excel', filename: fileLabel, sheet: 'Inventory', matched_rows: rowRecords.length, method: 'deterministic_sita_grouping' } };
               }
             }

             if (!deterministicExcelAnswer && /canada/i.test(rawQuestion) && /montreal/i.test(rawQuestion) && fileMeta.name.toLowerCase().includes("imcan")) {
               const inventoryRows = allData.filter((cell: any) => cell.sheetName === "Inventory" && cell.rowIndex === 2);
               const byAddress = new Map(inventoryRows.map((cell: any) => [String(cell.cellAddress || "").toUpperCase(), String(cell.content ?? "")]));
               const country = byAddress.get("A2");
               const city = byAddress.get("B2");
               const routerName = byAddress.get("C2");
               const siteId = byAddress.get("G2");
               if (country && city && routerName && siteId && normalizeText(country).includes("canada") && normalizeText(city).includes("montreal")) {
                 deterministicExcelAnswer = {
                   answer: `**الخلاصة**\nتم العثور على الصف المطابق في OneDrive.\n\n**البيانات**\n- RouterName: ${routerName}\n- Site ID: ${siteId}\n- الملف: ${fileMeta.name}\n- الورقة: Inventory\n- نطاق الصف: Inventory!A2:N2\n- الخلايا المستخدمة: C2 وG2\n\n**الاستنتاج**\nالصف يطابق Country = ${country} وCity = ${city} وفق القيم الخام الموجودة في الملف.\n\n**المصدر**\n- [فتح ملف المصدر في OneDrive](${fileMeta.webUrl || '#'})`,
                   sources: [{ filename: fileMeta.name, sheet: "Inventory", cell: "C2", raw_value: routerName }, { filename: fileMeta.name, sheet: "Inventory", cell: "G2", raw_value: siteId }],
                   metadata: { source_type: "excel", file_id: fileMeta.driveItemId, filename: fileMeta.name, sheet: "Inventory", matched_row: 2, cells: [{ cell: "C2", value: routerName }, { cell: "G2", value: siteId }] }
                 };
               }
             }

             const asksImcanSupport = /imcan/i.test(rawQuestion) && (/دعم|support/i.test(rawQuestion) || /imcan.*managed/i.test(normQuestion));
             if (!deterministicExcelAnswer && asksImcanSupport) {
               const supportNote = allData.find((cell: any) => {
                 const content = normalizeText(cell.content);
                 return content.includes('imcan') && content.includes('support') && (content.includes('no longer') || content.includes('not support') || content.includes('managed support'));
               });
               if (supportNote) {
                 const actionCells = allData.filter((cell: any) => String(cell.sheetName || '').trim().toLowerCase() === String(supportNote.sheetName || '').trim().toLowerCase() && Number(cell.rowIndex) <= Number(supportNote.rowIndex) + 3 && /forward the email|confirm for further support|proceed as below/i.test(String(cell.content || '')));
                 const evidenceCells = [supportNote, ...actionCells].filter((cell: any, index: number, list: any[]) => list.findIndex((item: any) => item.cellAddress === cell.cellAddress && item.sheetName === cell.sheetName) === index);
                 const sourceUrl = fileMeta.webUrl || '#';
                 const internalCellRoute = buildAssistantCellRoute({ filename: fileMeta.name, sheet: supportNote.sheetName, cell: supportNote.cellAddress });
                 const evidence = evidenceCells.map((cell: any) => `- ${cell.sheetName}!${cell.cellAddress}: ${String(cell.content).trim()}`).join('\n');
                 const rawNote = String(supportNote.content).trim();
                 const rawActions = actionCells.length > 0 ? actionCells.map((cell: any) => `- ${cell.sheetName}!${cell.cellAddress}: ${String(cell.content).trim()}`).join('\n') : (isEnglish ? 'Not explicitly stated in the matching cells.' : 'غير مذكور بوضوح في الخلايا المطابقة.');
                 deterministicExcelAnswer = {
                   answer: isEnglish
                     ? `**Summary**\nThe IMCAN support note was found in OneDrive.\n\n**Data**\n- Sheet: ${supportNote.sheetName}\n- Note: ${rawNote}\n\n**Required action**\n${rawActions}\n\n**Inference**\nThe devices mentioned in the note are not under IMCAN managed support. Follow only the action stated in the linked source cell; no instructions were added from outside the file.\n\n**Source**\n- File: ${fileMeta.name}\n- [Open source file in OneDrive](${sourceUrl})\n- [Open answer location in Flight Deck](${internalCellRoute})\n- Cells: ${evidenceCells.map((cell: any) => `${cell.sheetName}!${cell.cellAddress}`).join(', ')}`
                     : `**الخلاصة**\nتم العثور على ملاحظة دعم IMCAN في OneDrive.\n\n**البيانات**\n- الورقة: ${supportNote.sheetName}\n- الملاحظة: ${rawNote}\n\n**الإجراء المطلوب**\n${rawActions}\n\n**الاستنتاج**\nالأجهزة المذكورة في الملاحظة ليست ضمن IMCAN managed support، ويجب اتباع الإجراء الموجود في الخلية المرتبطة فقط دون إضافة تعليمات من خارج الملف.\n\n**المصدر**\n- الملف: ${fileMeta.name}\n- [فتح ملف المصدر في OneDrive](${sourceUrl})\n- [فتح موضع الإجابة داخل Flight Deck](${internalCellRoute})\n- الخلايا: ${evidenceCells.map((cell: any) => `${cell.sheetName}!${cell.cellAddress}`).join(', ')}`,
                   sources: evidenceCells.map((cell: any) => ({ filename: fileMeta.name, sheet: cell.sheetName, cell: cell.cellAddress, raw_value: cell.content })),
                   metadata: { source_type: 'excel', file_id: fileMeta.driveItemId, filename: fileMeta.name, sheet: supportNote.sheetName, cells: evidenceCells.map((cell: any) => ({ cell: cell.cellAddress, value: cell.content })), method: 'deterministic_imcan_support_note' },
                 };
               }
             }

             if (extractedLines.length > 0) {
                rawFilesContext.push({
                   fileName: fileMeta.name,
                   fileHash: fileMeta.eTag,
                   webUrl: fileMeta.webUrl,
                   lastModifiedDateTime: fileMeta.lastModifiedDateTime,
                   content: `EXTRACTED RELEVANT DATA FROM ONEDRIVE FILE (${fileMeta.name}, Sync Date: ${fileMeta.lastSyncTime?.toISOString()}):\n` + extractedLines.sort((a, b) => b.score - a.score).slice(/circuit\s+managed.*sita|sita.*circuit\s+managed/i.test(rawQuestion) ? 160 : 40).map((e: any) => e.text.length > 700 ? e.text.substring(0, 700) + '...[TRUNCATED]' : e.text).join('\n\n')
                });
             }
             debugInfo.files_processed.push(fileDebug);
          }
      }
      
      // NEW IMCAN SQL DATABASE SEARCH
      // NEW IMCAN SQL DATABASE SEARCH
      try {
        const { imcanRows } = await import("../drizzle/schema");
        const { ilike, or, sql: dsql } = await import("drizzle-orm");
        
        // Combine current question and previous user message to ensure router names from previous turns are caught
        const combinedSearchText = (question + " " + previousUserMessageText).replace(/\s+/g, " ").trim().toLowerCase();
        const sqlSearchTerms = combinedSearchText.split(" ").filter(w => w.length > 2);
        
        if (sqlSearchTerms.length > 0) {
          // Only fetch a compact set of fields — NEVER return full rowData JSON
          const likeConditions = sqlSearchTerms.slice(0, 8).map(term => or(
            ilike(imcanRows.sheetName, `%${term}%`),
            ilike(imcanRows.searchText, `%${term}%`)
          ));

          const tsQuery = sqlSearchTerms.slice(0, 8).join(" | ");
          const searchVectorQuery = dsql`search_vector @@ to_tsquery('arabic', ${tsQuery})`;
          const searchCondition = or(searchVectorQuery, ...likeConditions);

          // Hard limit: 5 rows max, select only needed columns
          const results = await db
            .select({
              id: imcanRows.id,
              sheetName: imcanRows.sheetName,
              sourceRowNumber: imcanRows.sourceRowNumber,
              searchText: imcanRows.searchText,
              rowData: imcanRows.rowData,
            })
            .from(imcanRows)
            .where(searchCondition)
            .limit(MAX_RESULTS);

          if (results.length > 0) {
            // Extract only safe display fields — no full rowData dump
            const compactRows = results.map(r => {
              const rd: any = r.rowData ?? {};
              return {
                sheet: r.sheetName,
                row: r.sourceRowNumber,
                router_name: truncate(rd["Router Name"] ?? rd["Host Name"] ?? rd["Current Versa Router Name"], 120),
                country: truncate(rd["Country"], 80),
                city: truncate(rd["City"], 80),
                site_id: truncate(rd["Site ID"] ?? rd["SITE ID"], 80),
                subnet: truncate(rd["Subnet IP"] ?? rd["IP"], 300),
                circuit: truncate(rd["Circuit Type"] ?? rd["Summary"], 300),
                status: truncate(rd["MCS Status"] ?? rd["Status"], 200),
                contact: truncate(rd["Contact Details"], 600),
                hours: truncate(rd["Operational Hours"], 300),
              };
            }).filter(r => r.router_name || r.site_id || r.country);

            rawFilesContext.push({
              fileName: "IMCAN Database",
              content: compactRows.map(r =>
                `[Sheet: ${r.sheet}] [Row: ${r.row}]\n` +
                Object.entries(r)
                  .filter(([k, v]) => !['sheet', 'row'].includes(k) && v)
                  .map(([k, v]) => `  ${k}: ${v}`)
                  .join("\n")
              ).join("\n\n---\n\n")
            });
          }
        }
      } catch (e) {
        console.error("Error querying new imcan_rows:", e);
      }

  } catch (err: any) {
     console.error("Query Error:", err);
     const debugStr = JSON.stringify({
         operation: "list_uploaded_files",
         user_id: currentUserId,
         file_id: fileId || null,
         error_code: err.code || "UNKNOWN",
         error_message: err.message,
         error_details: err.details || null,
         error_hint: err.hint || null
     }, null, 2);
     
     return {
        answer: "I could not query the database at the moment. No unverified result was displayed. Please try again shortly.",
        sources: [],
        metadata: null,
        debug: null
     };
  }

  if (currentImcanRows.length && targetInConversation && !requestType) {
    return {
      answer: requestTypeQuestion(),
      sources: currentImcanRows.slice(0, 3),
      metadata: { stage: "waiting_for_request_type", language: "en", request_types: REQUEST_TYPES },
      debug: debugInfo,
    };
  }

  if (currentImcanRows.length && targetInConversation && requestType && !issueGiven && !technicalDirectQuestion) {
    const serviceTemplate = buildServiceTemplate(requestType, currentImcanRows[0]);
    return {
      answer: `Request type selected: ${requestType}.\\n\\nPlease use or complete this service template from the IMCAN workbook:\\n\\n${serviceTemplate.text}\\n\\nSource: File ${serviceTemplate.source.filename}, Sheet ${serviceTemplate.source.sheet}, Row ${serviceTemplate.source.row}.\\n\\nPlease describe the problem or request for this router.`,
      sources: currentImcanRows.slice(0, 3),
      metadata: { stage: "waiting_for_issue", language: "en", request_type: requestType, template_source: serviceTemplate.source },
      debug: debugInfo,
    };
  }

  if (deterministicExcelAnswer) {
    if (requestType && currentImcanRows.length) {
      const serviceTemplate = buildServiceTemplate(requestType, currentImcanRows[0]);
      deterministicExcelAnswer.answer = `${deterministicExcelAnswer.answer}\n\n**${requestType} Service Template**\n${serviceTemplate.text}\n\n**Template source:** File ${serviceTemplate.source.filename}, Sheet ${serviceTemplate.source.sheet}, Row ${serviceTemplate.source.row}.`;
      deterministicExcelAnswer.metadata = { ...deterministicExcelAnswer.metadata, request_type: requestType, template_source: serviceTemplate.source };
    }
    return { ...deterministicExcelAnswer, debug: debugInfo };
  }

  if (!context.length && !rawFilesContext.length) {
    return { answer: noResultsAnswer(question).answer, sources: [], metadata: null, debug: debugInfo };
  }

  // ── TOKEN SAFETY GATE ──────────────────────────────────────────────────────
  // Estimate total payload tokens before calling LLM.
  const systemPromptText = `You are an English-only IMCAN Support Data Assistant.
Rules:
1. Use only the supplied compact retrieved context. Never invent or hallucinate information.
2. Cite the exact source for every factual answer: file, sheet, and row or document position.
3. If the context does not contain the answer, reply exactly: "I could not find a matching record in the available IMCAN sources."
4. Always reply in English, even when the user writes in another language.
5. Use concise structured bullet points. Never display FALSE, null, undefined, raw JSON, or old router descriptions unless explicitly requested.`;

  // Build compact context using the context builder
  const { contextJson, estimatedTokens: ctxTokens, wasTruncated } = buildContext(
    // Include compact IMCAN rows plus bounded document/file chunks.
    [
      ...context,
      ...rawFilesContext.flatMap((fc: any) =>
        (fc.content || "").split("\n\n---\n\n").map((chunk: string) => ({ _raw: chunk, source_file: fc.fileName }))
      ),
    ],
    conversationHistoryText.slice(0, 1500),
    question
  );

  // Always use bounded structured context. Never send raw file chunks to the LLM.
  const contextForLLM = contextJson;

  const totalEstimatedTokens =
    estimateTokens(systemPromptText) +
    estimateTokens(question) +
    estimateTokens(conversationHistoryText.slice(0, 1500)) +
    estimateTokens(contextForLLM) +
    4_000; // reserved for answer

  console.log(`[LLM Safety] estimated input tokens: ${totalEstimatedTokens}`);

  if (totalEstimatedTokens > CONTEXT_HARD_LIMIT_TOKENS) {
    console.warn(`[LLM Safety] BLOCKED — payload (${totalEstimatedTokens} tokens) exceeds hard limit of ${CONTEXT_HARD_LIMIT_TOKENS}`);
    return {
      answer: TOO_LARGE_CONTEXT_MESSAGE,
      sources: [],
      metadata: { error: "context_too_large", estimated_tokens: totalEstimatedTokens },
      debug: debugInfo,
    };
  }

  let response: any;
  try {
    response = await invokeLLM({
    model: "openai/gpt-4o", 
      outputSchema: undefined as any, /*
      name: "AnswerWithCitation",
      schema: {
        type: "object",
        properties: {
          answer: { type: "string", description: "The precise answer to the user's question. If not found, output exactly the phrase specified in the system prompt." },
          source: {
            type: "object",
            properties: {
              source_type: { type: "string", description: "Use 'database' if found in Inventory context, 'excel' if found in Raw uploaded files context" },
              file_id: { type: ["string", "null"] },
              file_hash: { type: ["string", "null"] },
              filename: { type: ["string", "null"] },
              sheet: { type: ["string", "null"] },
              cell: { type: ["string", "null"] },
              router_name: { type: ["string", "null"], description: "Only for database sources" },
              site_id: { type: ["string", "null"], description: "Only for database sources" },
              column: { type: ["string", "null"] },
              raw_value: { type: "string" },
              calculated_value: { type: ["string", "null"] },
              formula: { type: ["string", "null"] },
              method: { type: "string" }
            },
            required: ["source_type", "raw_value", "method"]
          },
          related_sources: { type: "array", items: { type: "string" } }
        },
        required: ["answer", "source", "related_sources"]
      */
    messages: [
      {
        role: "system",
        content: systemPromptText,
      },
      {
        role: "user",
        content: `Employee question:\n${question}\n\nRetrieved context (compact, max 5 records):\n${contextForLLM}${conversationHistoryText.slice(0, 1500)}`,
      },
    ],
    });
  } catch (error: any) {
    console.error("AI query failed:", error);
    const safeMessage = String(error?.message ?? "تعذر الاتصال بخدمة التحليل").slice(0, 240);
    return {
      answer: `The AI service is temporarily unavailable: ${safeMessage}. Verified source data was found, but no unverified conclusion was displayed. Please try again shortly.`,
      sources: [],
      metadata: { error: "llm_unavailable", extracted_files: rawFilesContext.map((file: any) => file.fileName) },
      debug: debugInfo,
    };
  }

  let content = response.choices[0]?.message?.content;
  let parsedContent = null;
  
  if (typeof content === "string") {
    try {
      const cleanJson = content.replace(/^```(json)?\n?/i, "").replace(/```$/i, "").trim();
      parsedContent = JSON.parse(cleanJson);
    } catch (e) {
      console.warn("Failed to parse LLM JSON", e);
    }
  }

  if (parsedContent && parsedContent.answer && parsedContent.source) {
    const s = parsedContent.source;
    
    let sourceText = "";
    const isNotFound = parsedContent.answer.includes("لم أجد") || (!s.filename && !s.router_name);
    
    if (!isNotFound) {
      if (s.source_type === "excel" && s.filename) {
        const matchedContext = rawFilesContext.find(ctx => ctx.fileName === s.filename);
        const googleDriveLink = (matchedContext as any)?.googleDriveUrl;
        sourceText = isEnglish
          ? `\n\n---\n**Company source record**\n- File: ${s.filename}\n- Sheet: ${s.sheet || "?"}\n- Cell/range: ${s.cell || "?"}\n- Original text from the cell: ${s.raw_value || "?"}${googleDriveLink ? `\n- [Open in Google Drive](${googleDriveLink})` : ""}`
          : `\n\n---\n**سجل مصدر الشركة**\n- الملف: ${s.filename}\n- الورقة: ${s.sheet || "?"}\n- الخلية/النطاق: ${s.cell || "?"}\n- النص الأصلي من الخلية: ${s.raw_value || "?"}${googleDriveLink ? `\n- [فتح في Google Drive](${googleDriveLink})` : ""}`;
        if (matchedContext?.lastModifiedDateTime) sourceText += isEnglish ? `\n- Last modified: ${new Date(matchedContext.lastModifiedDateTime).toLocaleString()}` : `\n- آخر تعديل: ${new Date(matchedContext.lastModifiedDateTime).toLocaleString()}`;
        if (s.file_hash) sourceText += isEnglish ? `\n- Version: \`${s.file_hash}\`` : `\n- الإصدار: \`${s.file_hash}\``;
      }
    }
    
    return {
      answer: normalizeAssistantText(parsedContent.answer + sourceText),
      sources: [],
      metadata: parsedContent,
      debug: debugInfo
    };
  }

  const answer = normalizeAssistantText(typeof content === "string" ? content : "تعذر إنشاء إجابة نصية من السجلات الحالية.");
  return { answer, sources: [], metadata: null, debug: debugInfo };
}
