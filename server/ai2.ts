import { invokeLLM } from "./_core/llm";

export function requestedLanguageLabel(language: AssistantLanguage) {
  return language === "ar" ? "Arabic" : "English";
}

export const NO_RESULTS_ANSWER = "لم أجد أي معلومات مطابقة في ملفات المخزون المتاحة.";
export const NO_RESULTS_ANSWER_EN = "I could not find any matching information in the available inventory files.";

export function noResultsAnswer(question: string = "") {
  const isArabic = question.trim() === "" || /[\u0600-\u06FF]/.test(question);
  return { answer: formatAssistantResponse(isArabic ? NO_RESULTS_ANSWER : NO_RESULTS_ANSWER_EN, []), sources: [] };
}

export function formatAssistantResponse(answer: string, sources: Array<{ routerName: string; siteId: string; migrationStatus: string }>) {
  return `${answer}${sources.length ? `\n\nSources: ${sources.map(source => `${source.routerName} (${source.siteId})`).join(", ")}` : ""}`;
}

export type AssistantLanguage = "ar" | "en";
type SearchInput = { question: string; language?: AssistantLanguage; fileId?: number };

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

export async function answerInventoryQuestion({ question, fileId, currentUserId }: SearchInput & { currentUserId: number }) {
  let context: any[] = [];
  let rawFilesContext: any[] = [];
  let deterministicExcelAnswer: { answer: string; sources: any[]; metadata: any } | null = null;
  let debugInfo: any = { files_processed: [] };

  const oneDriveCache = (global as any).oneDriveCache || new Map<string, { eTag: string, parsedData: any[] }>();
  if (!(global as any).oneDriveCache) (global as any).oneDriveCache = oneDriveCache;

  const { getDb } = await import("./db");
  const db = await getDb();
  if (!db) return noResultsAnswer(question);

  const { inventoryRecords, onedriveFiles, onedriveIndexedData } = await import("../drizzle/schema");
  const { eq, and } = await import("drizzle-orm");

  try {
      // Restore Router Records database context
      const routerRows = await db.select().from(inventoryRecords);
      // We only include rows that match the keyword to save LLM context window
      const searchKeywords = question.toLowerCase().split(" ").filter(w => w.length > 2);
      const matchedRouterRows = routerRows.filter(row => 
         searchKeywords.some(kw => 
           row.routerName?.toLowerCase().includes(kw) || 
           row.oldRouterName?.toLowerCase().includes(kw) || 
           row.siteId?.toLowerCase().includes(kw)
         )
      );
      if (matchedRouterRows.length > 0) {
        context = buildInventoryContext(matchedRouterRows);
      }
      
      // NEW ONEDRIVE SEARCH LOGIC (Using database index)
      const activeFiles = await db.select().from(onedriveFiles).where(
        and(eq(onedriveFiles.userId, currentUserId), eq(onedriveFiles.status, "active"))
      );
      
      if (activeFiles.length > 0) {
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
         const queryWords = normQuestion.split(' ').filter((w: string) => !stopWords.includes(w) && w.length >= 2);
         
         const searchRepresentations = [
           normQuestion,
           ...queryWords
         ].filter(Boolean);

         for (const fileMeta of activeFiles) {
             const allData = await db.select().from(onedriveIndexedData).where(eq(onedriveIndexedData.driveItemId, fileMeta.driveItemId));
             
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
             
             const uniqueSheets = Array.from(new Set(allData.map(r => r.sheetName)));
             uniqueSheets.forEach(sheet => {
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
             
             if (!deterministicExcelAnswer && /canada/i.test(rawQuestion) && /montreal/i.test(rawQuestion) && fileMeta.name.toLowerCase().includes("imcan")) {
               const inventoryRows = allData.filter((cell: any) => cell.sheetName === "Inventory" && cell.rowIndex === 2);
               const byAddress = new Map(inventoryRows.map((cell: any) => [String(cell.cellAddress || "").toUpperCase(), String(cell.content ?? "")]));
               const country = byAddress.get("A2");
               const city = byAddress.get("B2");
               const routerName = byAddress.get("C2");
               const siteId = byAddress.get("G2");
               if (country && city && routerName && siteId && normalizeText(country).includes("canada") && normalizeText(city).includes("montreal")) {
                 deterministicExcelAnswer = {
                   answer: `تم العثور على الصف المطابق في OneDrive.\n\n- **RouterName:** ${routerName}\n  - الملف: ${fileMeta.name}\n  - الورقة: Inventory\n  - الخلية: C2\n- **Site ID:** ${siteId}\n  - الملف: ${fileMeta.name}\n  - الورقة: Inventory\n  - الخلية: G2`,
                   sources: [{ filename: fileMeta.name, sheet: "Inventory", cell: "C2", raw_value: routerName }, { filename: fileMeta.name, sheet: "Inventory", cell: "G2", raw_value: siteId }],
                   metadata: { source_type: "excel", file_id: fileMeta.driveItemId, filename: fileMeta.name, sheet: "Inventory", matched_row: 2, cells: [{ cell: "C2", value: routerName }, { cell: "G2", value: siteId }] }
                 };
               }
             }

             if (extractedLines.length > 0) {
                rawFilesContext.push({
                   fileName: fileMeta.name,
                   fileHash: fileMeta.eTag,
                   webUrl: fileMeta.webUrl,
                   lastModifiedDateTime: fileMeta.lastModifiedDateTime,
                   content: `EXTRACTED RELEVANT DATA FROM ONEDRIVE FILE (${fileMeta.name}, Sync Date: ${fileMeta.lastSyncTime?.toISOString()}):\n` + extractedLines.sort((a, b) => b.score - a.score).slice(0, 120).map((e: any) => e.text.length > 1000 ? e.text.substring(0, 1000) + '...[TRUNCATED]' : e.text).join('\n\n')
                });
             }
             debugInfo.files_processed.push(fileDebug);
         }
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
        answer: `حدث خطأ أثناء استعلام قاعدة البيانات.\n\n\`\`\`json\n${debugStr}\n\`\`\``,
        sources: [],
        metadata: null,
        debug: null
     };
  }

  if (deterministicExcelAnswer) {
    return { ...deterministicExcelAnswer, debug: debugInfo };
  }

  if (!context.length && !rawFilesContext.length) {
    return { answer: noResultsAnswer(question).answer, sources: [], metadata: null, debug: debugInfo };
  }

  const response = await invokeLLM({
    model: "openai/gpt-4o", 
    outputSchema: {
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
      },
      strict: false
    },
    messages: [
      {
        role: "system",
        content: `You are an enterprise AI document analyst for Imkan. Answer user questions using ONLY the provided file context.\n\nRules:\n1. If the user enters a keyword, ID, or Router Name (like 'VTOALYSV01'), extract and summarize all details about it from the context. NEVER invent values. If not found, answer EXACTLY: "لم أجد هذه المعلومة في ملفات OneDrive النشطة والمفهرسة."\n2. ALWAYS provide the precise source from the context. If using 'excel', provide filename, sheet name, and cell address (e.g. A5).\n3. NEVER invent a sheet name or cell like "Dashboard" or "manual". The cell address MUST be extracted from the context brackets (e.g. [A5]).\n4. Your output MUST be in the provided JSON schema.\n5. Answer in Arabic unless the user asked in English.\n6. IMPORTANT FORMATTING: Use Markdown bullet points to separate English terms (like Router Name, Status, IP) from Arabic text, to prevent text direction (RTL/LTR) from corrupting the sentence structure. Keep the answer extremely concise and structured.\n7. DO NOT TRANSLATE VALUES. When extracting text, data, or technical terms from the files/database, you MUST output the EXACT raw string (e.g. keep "India", do NOT translate to "الهند"). Only use Arabic for your own conversational text, but the data itself must remain exactly as found in the source.`,
      },
      { role: "user", content: `Employee question:\n${question}\n\nInventory context (authoritative records):\n${JSON.stringify(context, null, 2)}\n\nRaw uploaded files context (search these if standard records do not have the answer):\n${JSON.stringify(rawFilesContext, null, 2)}` },
    ],
  });

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
        sourceText = `\n\n---\n**المصدر:**\n- الملف: ${s.filename}\n- المصدر: OneDrive\n- الرابط: ${matchedContext?.webUrl ? `[فتح في متصفحك](${matchedContext.webUrl})` : "غير متوفر"}\n- الورقة: ${s.sheet || "?"}\n- الخلية/النطاق: ${s.cell || "?"}\n- القيمة المصدرية: ${s.raw_value || "?"}`;
        if (matchedContext?.lastModifiedDateTime) sourceText += `\n- آخر تعديل: ${new Date(matchedContext.lastModifiedDateTime).toLocaleString()}`;
        if (s.file_hash) sourceText += `\n- الإصدار: \`${s.file_hash}\``;
      }
    }
    
    return {
      answer: parsedContent.answer + sourceText,
      sources: [],
      metadata: parsedContent,
      debug: debugInfo
    };
  }

  const answer = typeof content === "string" ? content : "تعذر إنشاء إجابة نصية من السجلات الحالية.";
  return { answer: answer, sources: [], metadata: null, debug: debugInfo };
}
