import { Router } from "express";
import { getDb } from "./db";
import {
  imcanRows,
  imcanDocumentItems,
  imcanDocumentAssets,
  imcanSources,
} from "../drizzle/schema";
import { eq, or, sql, ilike, inArray, and } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";
import {
  buildContext,
  estimateTokens,
  CONTEXT_HARD_LIMIT_TOKENS,
  TOO_LARGE_CONTEXT_MESSAGE,
  MAX_RESULTS,
  MAX_CLIENT_LIMIT,
  detectIntent,
  toCompactResult,
} from "./_core/contextBuilder";

export const imcanRouter = Router();

/* ─────────────────────────────────────────────
   CONSTANTS
   ───────────────────────────────────────────── */
const NEW_INVENTORY_HASH =
  "5aad8e9ef455c77a708788d43cbb4e374aefca9044e6a0a0ea2333b917bc4ae0";

const WORD_KEYWORDS = [
  "printer", "firmware", "printerSet", "printerset", "vcom",
  "usb", "xml", "amadeus", "atb", "btp", "configure", "configuration",
  "port", "com", "upgrade", "driver",
];

/* ─────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────── */

/** Normalise a query string: trim, collapse spaces, lowercase. */
function cleanText(s: string): string {
  return s.replace(/\s+/g, " ").trim().toLowerCase();
}

/** Sanitise a display value — never show booleans / null / raw JSON to users. */
function sanitiseValue(val: any): string | undefined {
  if (val === null || val === undefined) return undefined;
  if (typeof val === "boolean") return val ? "Yes" : "No";
  if (typeof val === "object") return undefined; // skip nested JSON
  const str = String(val).trim();
  return str === "" ? undefined : str;
}

/** Extract clean display fields from a row_data JSONB object. */
function extractRowFields(rowData: any): Record<string, string> {
  if (!rowData || typeof rowData !== "object") return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(rowData)) {
    const clean = sanitiseValue(v);
    if (clean) out[k] = clean;
  }
  return out;
}

/** Determine if query is technical (Word doc priority). */
function isTechnicalQuery(terms: string[]): boolean {
  return terms.some((t) => WORD_KEYWORDS.some((kw) => t.includes(kw)));
}

/**
 * Ranked multi-tier search in imcan_rows.
 * Returns rows with a numeric `score` (higher = better match).
 *
 * Tier 1 (score 1.0) : exact full-string ILIKE match on search_text
 * Tier 2 (score 0.85): all terms present in search_text (AND)
 * Tier 3 (score 0.60): any term present (OR, partial ILIKE)
 * Tier 4 (score 0.40): full-text search_vector
 *
 * Country / City / SiteID filter is applied on top when provided.
 */
async function searchExcelRows(opts: {
  db: any;
  query: string;
  sheet?: string | null;
  country?: string | null;
  city?: string | null;
  siteId?: string | null;
  sourceHash?: string | null; // restrict to a specific source by hash
  limit?: number;
}) {
  const {
    db,
    query,
    sheet,
    country,
    city,
    siteId,
    sourceHash,
    limit = MAX_RESULTS,
  } = opts;

  // Enforce hard cap: never more than MAX_CLIENT_LIMIT rows
  const safeLimit = Math.min(limit, MAX_CLIENT_LIMIT);

  // --- resolve source ID restriction ---
  let restrictedSourceId: number | null = null;
  if (sourceHash) {
    const src = await db
      .select()
      .from(imcanSources)
      .where(eq(imcanSources.hash, sourceHash))
      .limit(1);
    if (src && src.length > 0) restrictedSourceId = src[0].id;
  }

  // Build optional filters (AND-combined)
  const andFilters: any[] = [];
  if (restrictedSourceId !== null) {
    andFilters.push(eq(imcanRows.sourceId, restrictedSourceId));
  }
  if (sheet) {
    andFilters.push(ilike(imcanRows.sheetName, `%${sheet}%`));
  }
  if (country) {
    andFilters.push(ilike(imcanRows.searchText, `%${cleanText(country)}%`));
  }
  if (city) {
    andFilters.push(ilike(imcanRows.searchText, `%${cleanText(city)}%`));
  }
  if (siteId) {
    andFilters.push(ilike(imcanRows.searchText, `%${cleanText(siteId)}%`));
  }

  const cleanQ = cleanText(query);
  const terms = cleanQ.split(" ").filter((w) => w.length > 1);

  // Fetch a broad candidate set (up to 200) then score in JS
  const orConditions = terms.map((t) =>
    ilike(imcanRows.searchText, `%${t}%`)
  );
  const tsQ = terms.join(" | ");
  const vectorCondition = sql`search_vector @@ to_tsquery('simple', ${tsQ})`;

  const baseTextCondition =
    orConditions.length > 0
      ? or(...orConditions, vectorCondition)
      : vectorCondition;

  const finalWhere =
    andFilters.length > 0
      ? and(...andFilters, baseTextCondition)
      : baseTextCondition;

  const rawRows = await db
    .select({ row: imcanRows, source: imcanSources })
    .from(imcanRows)
    .leftJoin(imcanSources, eq(imcanRows.sourceId, imcanSources.id))
    .where(finalWhere)
    .limit(Math.min(safeLimit * 10, 100)); // fetch a candidate set then re-rank

  // Score each row
  const scored = rawRows.map(({ row: r, source: s }: any) => {
    const st = (r.searchText || "").toLowerCase();
    let score = 0;

    // Tier 1 — exact full string
    if (st === cleanQ || st.includes(`\t${cleanQ}\t`)) {
      score = 1.0;
    }
    // Tier 2 — all terms present (AND)
    else if (terms.length > 0 && terms.every((t) => st.includes(t))) {
      score = 0.85;
    }
    // Tier 3 — any term present (OR)
    else if (terms.some((t) => st.includes(t))) {
      score = 0.6;
    }
    // Tier 4 — vector match only
    else {
      score = 0.4;
    }

    // Boost if source matches the expected source
    if (s && s.hash === NEW_INVENTORY_HASH) score += 0.05;

    return {
      source_id: r.sourceId,
      source_file: s ? s.fileName || "Unknown Source" : "Unknown Source",
      version_label: s ? s.version : undefined,
      sheet_name: r.sheetName,
      source_row_number: r.sourceRowNumber,
      row_data: extractRowFields(r.rowData),
      search_text: r.searchText,
      score: Math.min(score, 1.0),
    };
  });

  // Sort by score desc, then sheet, then row
  scored.sort(
    (a: any, b: any) =>
      b.score - a.score ||
      (a.sheet_name || "").localeCompare(b.sheet_name || "") ||
      (a.source_row_number || 0) - (b.source_row_number || 0)
  );

  return scored.slice(0, safeLimit);
}

/** Search Word document items and attach related image assets. */
async function searchWordItems(opts: {
  db: any;
  terms: string[];
  limit?: number;
}) {
  const { db, terms, limit = 10 } = opts;
  if (terms.length === 0) return [];

  const likeConditions = terms.map((t) =>
    ilike(imcanDocumentItems.contentText, `%${t}%`)
  );
  const tsQ = terms.join(" | ");
  const vectorCond = sql`search_vector @@ to_tsquery('simple', ${tsQ})`;

  const rawWord = await db
    .select()
    .from(imcanDocumentItems)
    .where(or(...likeConditions, vectorCond))
    .limit(limit);

  // Attach assets
  const docIds = Array.from(
    new Set(rawWord.map((r: any) => r.documentId).filter(Boolean))
  ) as number[];

  const assetsMap = new Map<string, any[]>();
  if (docIds.length > 0) {
    const assets = await db
      .select()
      .from(imcanDocumentAssets)
      .where(inArray(imcanDocumentAssets.documentId, docIds));

    for (const a of assets) {
      const positions = (a.relatedItemPositions as number[]) || [];
      for (const pos of positions) {
        const key = `${a.documentId}-${pos}`;
        if (!assetsMap.has(key)) assetsMap.set(key, []);
        assetsMap.get(key)!.push({
          asset_name: a.assetName,
          asset_kind: a.assetKind,
          mime_type: a.mimeType,
          cdn_url: a.cdnUrl,
        });
      }
    }
  }

  return rawWord.map((r: any) => ({
    type: "word_document",
    source_file: "IMCANEUCSheet2024.docx",
    position: r.position,
    content_text: r.contentText,
    assets: (assetsMap.get(`${r.documentId}-${r.position}`) || []).slice(0, 3),
    score: 0.9,
  }));
}

/* ─────────────────────────────────────────────
   ROUTE: /api/new-inventory/search (dedicated)
   ───────────────────────────────────────────── */
imcanRouter.post("/new-inventory/search", async (req, res) => {
  try {
    const { query, sheet, country, city, site_id } = req.body;
    // Enforce retrieval limits: default 5, max 10
    const rawLimit = Number(req.body.limit ?? MAX_RESULTS);
    const limit = Math.min(isNaN(rawLimit) ? MAX_RESULTS : rawLimit, MAX_CLIENT_LIMIT);

    if (!query || String(query).trim() === "")
      return res.status(400).json({ error: "Missing query" });

    const db = await getDb();
    if (!db) return res.status(500).json({ error: "No DB" });

    const results = await searchExcelRows({
      db,
      query,
      sheet,
      country,
      city,
      siteId: site_id,
      sourceHash: NEW_INVENTORY_HASH,
      limit,
    });

    const status =
      results.length === 0
        ? "not_found"
        : results[0].score >= 0.85
        ? "matched"
        : "partial";

    // Compact the row_data — never return the full JSONB object to clients
    const compactResults = results.map((r: any) => ({
      source_file: r.source_file,
      version_label: r.version_label,
      sheet_name: r.sheet_name,
      source_row_number: r.source_row_number,
      fields: r.row_data, // already sanitised by extractRowFields
      source_score: r.score,
    }));

    return res.json({
      status,
      result_count: compactResults.length,
      context_token_estimate: estimateTokens(JSON.stringify(compactResults)),
      results: compactResults,
      sources: compactResults.map((r: any) => ({ source_file: r.source_file, sheet_name: r.sheet_name, source_row_number: r.source_row_number })),
    });
  } catch (e: any) {
    console.error("new-inventory/search error", e);
    return res.status(500).json({ error: e.message });
  }
});

/* ─────────────────────────────────────────────
   ROUTE: /api/imcan/search (unified, all sources)
   ───────────────────────────────────────────── */
imcanRouter.post("/search", async (req, res) => {
  try {
    const {
      query,
      country = null,
      city = null,
      site_id = null,
      sheet = null,
    } = req.body;

    // Enforce retrieval limits: default 5, hard max 10
    const rawLimit = Number(req.body.limit ?? MAX_RESULTS);
    const limit = Math.min(isNaN(rawLimit) ? MAX_RESULTS : rawLimit, MAX_CLIENT_LIMIT);

    if (!query || String(query).trim() === "")
      return res.status(400).json({ error: "Missing query" });

    const db = await getDb();
    if (!db) return res.status(500).json({ error: "No DB" });

    const cleanQ = cleanText(query);
    const terms = cleanQ.split(" ").filter((w) => w.length > 1);

    const isTechnical = isTechnicalQuery(terms);

    let results: any[] = [];

    if (isTechnical) {
      // Step A: Word doc first
      const wordResults = await searchWordItems({ db, terms, limit });
      // Step B: also search Excel for context
      const excelResults = await searchExcelRows({
        db, query, sheet, country, city, siteId: site_id, limit: 5,
      });
      results = [...wordResults, ...excelResults].sort(
        (a, b) => b.score - a.score
      );
    } else {
      // Step A: NewInventory first
      const newResults = await searchExcelRows({
        db, query, sheet, country, city, siteId: site_id,
        sourceHash: NEW_INVENTORY_HASH, limit,
      });
      // Step B: Old IMCAN reference (no hash restriction) as fallback
      const oldResults = await searchExcelRows({
        db, query, sheet, country, city, siteId: site_id, limit,
      });
      // Merge: prefer NewInventory, deduplicate by row number + sheet
      const seen = new Set<string>();
      for (const r of [...newResults, ...oldResults]) {
        const key = `${r.source_file}|${r.sheet_name}|${r.source_row_number}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push(r);
        }
      }
      results = results.sort((a, b) => b.score - a.score).slice(0, limit);
    }

    const status =
      results.length === 0
        ? "not_found"
        : results[0].score >= 0.85
        ? "matched"
        : "partial";

    // Return compact response — never dump full row_data
    const intent = detectIntent(query);
    const compactResults = results.map((r: any) => toCompactResult(r.row_data ? { ...r, ...r.row_data } : r, intent));

    return res.json({
      status,
      result_count: compactResults.length,
      context_token_estimate: estimateTokens(JSON.stringify(compactResults)),
      results: compactResults,
      sources: results.map((r: any) => ({ source_file: r.source_file, sheet_name: r.sheet_name, source_row_number: r.source_row_number })),
    });
  } catch (e: any) {
    console.error("imcan/search error", e);
    return res.status(500).json({ error: e.message });
  }
});

/* ═══════════════════════════════════════════════════════════════════
   INTELLIGENT CHATBOT ROUTER
   ─────────────────────────────────────────────────────────────────
   Intent types:
     A. DIRECT_ROUTER_LOOKUP      – user gave a clear identifier
     B. DIRECT_DATA_QUESTION      – specific searchable question
     C. GENERAL_PROBLEM_NO_TARGET – vague complaint, no identifier
     D. TARGET_AND_PROBLEM        – identifier + issue in one msg
     E. AMBIGUOUS_QUERY           – too broad to match
     F. TECHNICAL_PROCEDURE_QUERY – printer/firmware/VCOM/XML/…
   ═══════════════════════════════════════════════════════════════════ */

/* ─── English enforcement ──────────────────────────────────────── */

function sanitiseResponseMessage(msg: string): string {
  // Never show Arabic fallback text to the user
  if (/[\u0600-\u06FF]/.test(msg))
    return "I could not find a matching record in the available IMCAN sources.";
  return msg;
}

function buildUserResponse(payload: Record<string, any>): Record<string, any> {
  return {
    ...payload,
    language: "en",
    message: sanitiseResponseMessage(String(payload.message ?? "")),
  };
}

/* ─── Entity extraction ─────────────────────────────────────────── */

interface ExtractedEntities {
  versaRouter: string | null;   // e.g. VAPAMM001
  siteId: string | null;        // e.g. SITE-123
  airportCode: string | null;   // e.g. AMM
  country: string | null;
  city: string | null;
  subnet: string | null;
  hostname: string | null;
  technicalKeyword: string | null;
  issueDescription: string | null;
}

/** Extract all known entity types from a free-form message. */
function extractEntities(msg: string): ExtractedEntities {
  const q = msg;

  // Versa router name (VAP prefix)
  const versaMatch = q.match(/\b(VAP[A-Z0-9_-]{3,})\b/i);
  const versaRouter = versaMatch ? versaMatch[1].toUpperCase() : null;

  // Site ID: letters+digits separated by dashes, min 5 chars
  const siteMatch = q.match(/\b([A-Z]{2,4}-\d{3,})\b/i);
  const siteId = siteMatch && !versaRouter ? siteMatch[1].toUpperCase() : null;

  // Airport IATA code (exactly 3 uppercase letters standing alone)
  const iataMatch = q.match(/\b([A-Z]{3})\b/);
  const airportCode = iataMatch && !versaRouter ? iataMatch[1] : null;

  // Subnet (IP address pattern)
  const subnetMatch = q.match(/\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?:\/\d{1,2})?)\b/);
  const subnet = subnetMatch ? subnetMatch[1] : null;

  // Known countries
  const countryMatch = q.match(
    /\b(jordan|saudi arabia|bahrain|kuwait|qatar|uae|oman|egypt|iraq|lebanon|syria|canada|uk|france|germany|usa|india|singapore|malaysia|turkey|pakistan)\b/i
  );
  const country = countryMatch ? countryMatch[1] : null;

  // Known cities
  const cityMatch = q.match(
    /\b(amman|riyadh|manama|kuwait city|doha|dubai|abu dhabi|muscat|cairo|baghdad|beirut|damascus|montreal|london|paris|berlin|karachi|delhi|mumbai|istanbul|ankara)\b/i
  );
  const city = cityMatch ? cityMatch[1] : null;

  // Hostname (dotted notation or domain-like)
  const hostMatch = q.match(/\b([a-z0-9][a-z0-9_-]{3,}\.[a-z0-9.-]{2,})\b/i);
  const hostname = hostMatch ? hostMatch[1] : null;

  // Technical keywords
  const techKeywords = [
    "vcom", "printer", "firmware", "printerset", "usb", "xml",
    "amadeus", "atb", "btp", "com port", "driver", "upgrade",
    "configuration", "configure",
  ];
  const ql = q.toLowerCase();
  const technicalKeyword = techKeywords.find((k) => ql.includes(k)) ?? null;

  // Issue keywords
  const issueMatch = q.match(
    /\b(not responding|unreachable|down|failed|offline|slow|latency|drop|cannot|can't|not working|error|fault|outage|issue|problem)\b/i
  );
  const issueDescription = issueMatch ? issueMatch[0] : null;

  return {
    versaRouter, siteId, airportCode, country, city,
    subnet, hostname, technicalKeyword, issueDescription,
  };
}

/** Returns the primary search term(s) from extracted entities. */
function buildSearchQuery(entities: ExtractedEntities, raw: string): string {
  if (entities.versaRouter) return entities.versaRouter;
  if (entities.siteId) return entities.siteId;
  if (entities.subnet) return entities.subnet;
  if (entities.hostname) return entities.hostname;
  if (entities.technicalKeyword) return entities.technicalKeyword;
  const parts = [entities.country, entities.city, entities.airportCode].filter(Boolean);
  if (parts.length) return parts.join(" ");
  return raw; // fallback: raw question
}

/* ─── Intent classifier ─────────────────────────────────────────── */

type ChatIntent =
  | "DIRECT_ROUTER_LOOKUP"       // A: has identifier, no issue yet
  | "DIRECT_DATA_QUESTION"       // B: specific searchable question
  | "GENERAL_PROBLEM_NO_TARGET"  // C: vague, no identifier
  | "TARGET_AND_PROBLEM"         // D: identifier + issue in one msg
  | "AMBIGUOUS_QUERY"            // E: too short / too broad
  | "TECHNICAL_PROCEDURE_QUERY"; // F: printer/VCOM/XML/Amadeus/…

function classifyIntent(msg: string, entities: ExtractedEntities): ChatIntent {
  const q = msg.trim().toLowerCase();

  // F: Technical procedure keywords (always Word doc search, no router required)
  if (entities.technicalKeyword) return "TECHNICAL_PROCEDURE_QUERY";

  const hasIdentifier = !!(
    entities.versaRouter || entities.siteId || entities.airportCode ||
    entities.hostname || entities.subnet || entities.country || entities.city
  );
  const hasIssue = !!entities.issueDescription;

  // D: Has both identifier and issue in the same message
  if (hasIdentifier && hasIssue) return "TARGET_AND_PROBLEM";

  // A: Has identifier but no issue
  if (hasIdentifier && !hasIssue) return "DIRECT_ROUTER_LOOKUP";

  // B: Specific searchable data question (no router needed)
  if (
    /\b(who is|what is|which|how do|how to|where is|what are|give me|show me|list|find|get|tell me)\b/i.test(msg) &&
    /\b(resolver|escalation|contact|scc|dns|hostname|procedure|step|configure|configuration|firmware|vcom|printer|sites? in|routers? in|subnet|circuit)\b/i.test(msg)
  ) {
    return "DIRECT_DATA_QUESTION";
  }

  // E: Too short or ambiguous (less than 4 chars or only 1 token)
  const tokens = msg.trim().split(/\s+/);
  if (tokens.length === 1 && tokens[0].length < 6) return "AMBIGUOUS_QUERY";

  // C: General vague complaint
  if (
    /^(hello|hi|hey|help|i need help|can you help|please help)/i.test(q) ||
    /^i (have|got|am having|am facing) (a |an )?(router|network|internet|connectivity|vpn|link|circuit|wan|switch|issue|problem|error|fault|outage|incident)/i.test(q) ||
    /^(there is|there's|we have|we got) (a |an )?(problem|issue|outage|fault|incident)/i.test(q) ||
    /^(the |a )?(router|network|link|circuit|switch) (is |are )?(down|not responding|not working|unreachable|failed|offline)/i.test(q) ||
    (!hasIdentifier && !hasIssue)
  ) {
    return "GENERAL_PROBLEM_NO_TARGET";
  }

  return "GENERAL_PROBLEM_NO_TARGET";
}

/* ─── Smart clarification question ─────────────────────────────── */

function buildClarificationQuestion(entities: ExtractedEntities, raw: string): string {
  // Problem-type aware clarification
  if (entities.technicalKeyword === "printer" || /printer/i.test(raw)) {
    return "Which site or printer are you referring to, and what is the exact printer issue?";
  }
  if (/vcom/i.test(raw)) {
    return "Which site or router VCOM configuration do you need?";
  }
  return "Which site, airport, router, or site ID should I search for?";
}

/* ─── Source selection ──────────────────────────────────────────── */

type SourcePriority = "NEW_INVENTORY" | "IMCAN_REFERENCE" | "WORD_DOC" | "ALL";

function selectSource(intent: ChatIntent, entities: ExtractedEntities): SourcePriority {
  if (intent === "TECHNICAL_PROCEDURE_QUERY") return "WORD_DOC";
  if (
    /\b(resolver|escalation|scc|dns|operational|historical|major router|major.router)\b/i.test(
      `${entities.technicalKeyword ?? ""} ${entities.issueDescription ?? ""}`
    )
  ) return "IMCAN_REFERENCE";
  return "NEW_INVENTORY"; // default: current inventory first, then reference as fallback
}

/* ─── LLM system prompt ─────────────────────────────────────────── */

const CHAT_SYSTEM_PROMPT = `You are an English-only IMCAN Support Data Assistant.
All user-facing messages must be in English. Never answer in Arabic, even when the user writes in Arabic.
Use ONLY the verified data from the retrieved database context. Never invent data.

STRICT RULES:
1. Never display old/legacy router names unless explicitly asked.
2. Never show boolean values (true/false). Convert to Yes/No if relevant, or omit entirely.
3. Never show null, undefined, empty objects, or raw JSON.
4. Never combine fields from different rows into one answer.
5. Every factual answer must cite: Source File, Sheet Name, and Original Row Number (or Document Position).
6. If not found, respond exactly: "I could not find a matching record in the available IMCAN sources."
7. If partial match: "I found a partial match, but the available data is not sufficient to confirm."
8. ALWAYS respond in English only.

RESPONSE FORMAT (English bullet points — omit any field that is empty, null, false, or undefined):
- Finding:
- Current Versa Router Name:
- Site ID:
- Country:
- City:
- Issue:
- Relevant Data:
- Contact or Resolver:
- Source File:
- Sheet or Document Section:
- Original Row Number or Document Position:
- Related Image:

Return a JSON object with this schema ONLY:
{
  "message": "Full English bullet-point answer",
  "language": "en",
  "stage": "answer_ready",
  "found_record": boolean,
  "sources": [{ "source_file": string, "sheet_name"?: string, "source_row_number"?: number, "position"?: number }],
  "results": [],
  "attachments": [{ "asset_name": string, "mime_type": string, "url": string, "reason": string }]
}`;

/* ─── Helpers: response building and no-match ───────────────────── */

function noMatchForTarget(target: string): Record<string, any> {
  return buildUserResponse({
    stage: "answer_ready",
    message:
      `I could not find "${target}" in the available IMCAN sources. ` +
      "Please check the router name or provide the country, city, airport, or site ID.",
    found_record: false,
    sources: [],
    results: [],
    attachments: [],
  });
}

function sourceNotSufficient(): Record<string, any> {
  return buildUserResponse({
    stage: "answer_ready",
    message:
      "I found the relevant source, but it does not contain enough information to answer this question.",
    found_record: false,
    sources: [],
    results: [],
    attachments: [],
  });
}

/* ─── /api/imcan/chat route ─────────────────────────────────────── */

imcanRouter.post("/chat", async (req, res) => {
  try {
    const { question, resolved_record = null } = req.body;

    if (!question || String(question).trim() === "")
      return res.status(400).json({ error: "Missing question" });

    const db = await getDb();
    if (!db) return res.status(500).json({ error: "No DB" });

    /* ── Step 1: Classify intent ── */
    const entities = extractEntities(question);
    const intent = classifyIntent(question, entities);
    const sourcePriority = selectSource(intent, entities);
    const searchQuery = buildSearchQuery(entities, question);
    const terms = cleanText(question).split(" ").filter((w) => w.length > 1);

    console.log(`[IMCAN /chat] intent=${intent} source=${sourcePriority} query="${searchQuery}"`);

    /* ══════════════════════════════════════════════════════════════
       INTENT C: GENERAL_PROBLEM_NO_TARGET
       Vague complaint — ask for identifier. NO DB call, NO LLM.
    ══════════════════════════════════════════════════════════════ */
    if (intent === "GENERAL_PROBLEM_NO_TARGET" && !resolved_record) {
      return res.json(
        buildUserResponse({
          stage: "waiting_for_target",
          message: buildClarificationQuestion(entities, question),
          found_record: false,
          sources: [],
          results: [],
          attachments: [],
        })
      );
    }

    /* ══════════════════════════════════════════════════════════════
       INTENT E: AMBIGUOUS_QUERY
       Too short / too broad — ask to narrow. NO DB call, NO LLM.
    ══════════════════════════════════════════════════════════════ */
    if (intent === "AMBIGUOUS_QUERY" && !resolved_record) {
      return res.json(
        buildUserResponse({
          stage: "waiting_for_target",
          message:
            "I found multiple possible matches. Please provide the country, city, airport, or site ID.",
          found_record: false,
          sources: [],
          results: [],
          attachments: [],
        })
      );
    }

    /* ══════════════════════════════════════════════════════════════
       SEARCH: All other intents require a DB query
    ══════════════════════════════════════════════════════════════ */
    let excelContext: any[] = [];
    let wordContext: any[] = [];

    if (sourcePriority === "WORD_DOC" || intent === "TECHNICAL_PROCEDURE_QUERY") {
      // F: Word document first for technical procedures
      wordContext = await searchWordItems({ db, terms, limit: 5 });
      // Also search Excel if we have a site/city context
      if (entities.country || entities.city || entities.versaRouter) {
        const excelResults = await searchExcelRows({
          db, query: searchQuery, limit: MAX_RESULTS,
        });
        excelContext = excelResults;
      }
    } else if (sourcePriority === "IMCAN_REFERENCE") {
      // B: IMCAN reference sheet for operational/resolver data
      excelContext = await searchExcelRows({
        db, query: searchQuery, limit: MAX_RESULTS,
      });
    } else {
      // Default: NewInventory first, then IMCAN reference as fallback
      const newInv = await searchExcelRows({
        db, query: searchQuery,
        sourceHash: NEW_INVENTORY_HASH,
        country: entities.country ?? undefined,
        city: entities.city ?? undefined,
        siteId: entities.siteId ?? undefined,
        limit: MAX_RESULTS,
      });
      excelContext.push(...newInv);

      // Fallback to IMCAN reference for any gaps
      const ref = await searchExcelRows({
        db, query: searchQuery,
        country: entities.country ?? undefined,
        city: entities.city ?? undefined,
        siteId: entities.siteId ?? undefined,
        limit: MAX_RESULTS,
      });
      const seen = new Set(excelContext.map((r) => `${r.source_file}|${r.sheet_name}|${r.source_row_number}`));
      for (const r of ref) {
        const key = `${r.source_file}|${r.sheet_name}|${r.source_row_number}`;
        if (!seen.has(key)) { seen.add(key); excelContext.push(r); }
      }
    }

    const combinedContext = intent === "TECHNICAL_PROCEDURE_QUERY"
      ? [...wordContext, ...excelContext]
      : [...excelContext, ...wordContext];

    /* ── No results ── */
    if (combinedContext.length === 0) {
      const target = entities.versaRouter ?? entities.siteId ?? entities.airportCode
        ?? entities.hostname ?? entities.city ?? entities.country ?? searchQuery;
      return res.json(noMatchForTarget(target));
    }

    /* ══════════════════════════════════════════════════════════════
       INTENT A: DIRECT_ROUTER_LOOKUP
       Identifier found but no issue yet → confirm record, ask for problem.
       NO LLM call.
    ══════════════════════════════════════════════════════════════ */
    if (intent === "DIRECT_ROUTER_LOOKUP" && !resolved_record) {
      // Multiple distinct routers → ask for disambiguation
      const uniqueRouters = new Set(
        combinedContext
          .map((r: any) =>
            r.row_data?.["Router Name"] ??
            r.row_data?.["Host Name"] ??
            r.row_data?.["Current Versa Router Name"] ??
            r.current_versa_router_name
          )
          .filter(Boolean)
      );

      if (uniqueRouters.size > 1) {
        return res.json(
          buildUserResponse({
            stage: "waiting_for_target",
            message:
              "I found multiple matching records. Please provide the country, city, airport, or site ID to narrow the search.",
            found_record: false,
            sources: combinedContext.slice(0, 3).map((r: any) => ({
              source_file: r.source_file,
              sheet_name: r.sheet_name,
              source_row_number: r.source_row_number,
            })),
            results: [],
            attachments: [],
          })
        );
      }

      // Exactly one router found → confirm and ask for the issue
      return res.json(
        buildUserResponse({
          stage: "waiting_for_issue",
          message:
            "I found the matching router record. What problem would you like me to investigate?",
          found_record: true,
          sources: combinedContext.slice(0, 3).map((r: any) => ({
            source_file: r.source_file,
            sheet_name: r.sheet_name,
            source_row_number: r.source_row_number,
            position: r.position,
          })),
          results: [],
          attachments: [],
        })
      );
    }

    /* ══════════════════════════════════════════════════════════════
       STATE: ANSWER_READY — call LLM with compact context
    ══════════════════════════════════════════════════════════════ */
    const intentCtx = detectIntent(question);
    const compactContext = combinedContext
      .slice(0, MAX_RESULTS)
      .map((r: any) => toCompactResult(r, intentCtx));

    const compactContextJson = JSON.stringify(compactContext);

    const totalEstimatedTokens =
      estimateTokens(CHAT_SYSTEM_PROMPT) +
      estimateTokens(question) +
      estimateTokens(compactContextJson) +
      4_000;

    console.log(`[IMCAN /chat] estimated tokens: ${totalEstimatedTokens}, results: ${compactContext.length}`);

    if (totalEstimatedTokens > CONTEXT_HARD_LIMIT_TOKENS) {
      console.warn(`[IMCAN /chat] BLOCKED — payload too large (${totalEstimatedTokens} tokens)`);
      return res.json(
        buildUserResponse({
          stage: "needs_clarification",
          message: TOO_LARGE_CONTEXT_MESSAGE,
          found_record: false,
          sources: [],
          results: [],
          attachments: [],
          context_token_estimate: totalEstimatedTokens,
        })
      );
    }

    const llmResponse = await invokeLLM({
      model: "openai/gpt-4o",
      messages: [
        { role: "system", content: CHAT_SYSTEM_PROMPT },
        {
          role: "user",
          content:
            `Question: ${question}\n\n` +
            `Retrieved Context (${compactContext.length} records, intent: ${intent}):\n${compactContextJson}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const raw = llmResponse.choices[0]?.message?.content;
    let parsed: any = {
      message: "I could not find a matching record in the available IMCAN sources.",
      language: "en",
      stage: "answer_ready",
      found_record: false,
      sources: [],
      results: [],
      attachments: [],
    };

    if (typeof raw === "string") {
      try { parsed = JSON.parse(raw); } catch (_) { /* keep default */ }
    }

    return res.json(buildUserResponse(parsed));

  } catch (e: any) {
    console.error("imcan/chat error", e);
    return res.status(500).json({ error: e.message });
  }
});
