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

/* ─────────────────────────────────────────────
   HELPERS for /chat
   ───────────────────────────────────────────── */

/** Reject Arabic fallback messages — replace with English equivalent. */
function sanitiseResponseMessage(msg: string): string {
  if (/[\u0600-\u06FF]/.test(msg))
    return "I could not find a matching record in the available IMCAN sources.";
  return msg;
}

/** Enforce English on every /chat response. */
function buildUserResponse(payload: Record<string, any>): Record<string, any> {
  return { ...payload, language: "en", message: sanitiseResponseMessage(String(payload.message ?? "")) };
}

/** Extract a searchable site/router identifier from free-form text, or null. */
function extractTargetIdentifier(question: string): string | null {
  // Versa router (VAPAMM001, VAPLON002 …)
  const m1 = question.match(/\b(VAP[A-Z0-9_-]{3,})\b/i);
  if (m1) return m1[1].toUpperCase();
  // Airport IATA code (3 uppercase letters)
  const m2 = question.match(/\b([A-Z]{3})\b/);
  if (m2) return m2[1];
  // Generic site-ID: 5+ alphanum chars that contain a digit
  for (const tok of question.split(/\s+/)) {
    if (/^[A-Z0-9_-]{5,}$/i.test(tok) && /[0-9]/.test(tok)) return tok.toUpperCase();
  }
  // Geo keywords
  const m3 = question.match(
    /\b(jordan|amman|canada|montreal|london|paris|cairo|dubai|kuwait|doha|riyadh|bahrain|abu dhabi|istanbul|beirut|damascus|baghdad|muscat|karachi|delhi|mumbai|singapore)\b/i
  );
  if (m3) return m3[1];
  return null;
}

/** True when the message is only a vague complaint with no searchable identifier. */
function isGeneralIssueOnly(question: string): boolean {
  if (extractTargetIdentifier(question)) return false;
  const q = question.trim();
  return (
    /^i (have|got|am having|am facing) (a |an )?(router|network|internet|connectivity|vpn|link|circuit|wan|switch|issue|problem|error|fault|outage|incident)/i.test(q) ||
    /^(there is|there's|we have|we got) (a |an )?(problem|issue|outage|fault|incident)/i.test(q) ||
    /^(the |a )?(router|network|link|circuit|switch) (is |are )?(down|not responding|not working|unreachable|failed|offline)/i.test(q) ||
    /^(help|i need help|can you help|please help)/i.test(q) ||
    /^(hello|hi|hey|سلام|مرحبا|مرحباً)/i.test(q)
  );
}

/* ─────────────────────────────────────────────
   ROUTE: /api/imcan/chat
   State machine:
     WAITING_FOR_TARGET → TARGET_FOUND → WAITING_FOR_ISSUE
                       → ISSUE_SEARCH  → ANSWER_READY
   ───────────────────────────────────────────── */
imcanRouter.post("/chat", async (req, res) => {
  try {
    const {
      question,
      resolved_record = null,
    } = req.body;

    if (!question || String(question).trim() === "")
      return res.status(400).json({ error: "Missing question" });

    const db = await getDb();
    if (!db) return res.status(500).json({ error: "No DB" });

    const cleanQ = cleanText(question);
    const terms = cleanQ.split(" ").filter((w) => w.length > 1);
    const isTechnical = isTechnicalQuery(terms);

    /* ══════════════════════════════════════════════════════════════
       STATE: WAITING_FOR_TARGET
       If the message is a general complaint with no searchable
       identifier, return the clarification question immediately.
       No DB call, no LLM call.
    ══════════════════════════════════════════════════════════════ */
    const targetId = extractTargetIdentifier(question);
    const generalOnly = isGeneralIssueOnly(question);

    if (!targetId && !resolved_record && !isTechnical && generalOnly) {
      return res.json(
        buildUserResponse({
          stage: "waiting_for_target",
          message: "Which site, airport, router, or site ID should I search for?",
          found_record: false,
          sources: [],
          results: [],
          attachments: [],
        })
      );
    }

    /* ── STEP 2 & 4: Search sources ── */
    let excelContext: any[] = [];
    let wordContext: any[] = [];

    // Always try NewInventory first for site/router lookup
    const newInvResults = await searchExcelRows({
      db,
      query: question,
      sourceHash: NEW_INVENTORY_HASH,
      limit: 5,
    });
    excelContext.push(...newInvResults);

    // If question looks like it needs historical/operational data, also search old IMCAN
    if (!isTechnical) {
      const oldResults = await searchExcelRows({
        db,
        query: question,
        limit: 5,
      });
      // Add old results that aren't duplicates
      const existing = new Set(
        excelContext.map(
          (r) => `${r.source_file}|${r.sheet_name}|${r.source_row_number}`
        )
      );
      for (const r of oldResults) {
        const key = `${r.source_file}|${r.sheet_name}|${r.source_row_number}`;
        if (!existing.has(key)) excelContext.push(r);
      }
    }

    // Search Word doc for technical queries
    if (isTechnical) {
      wordContext = await searchWordItems({ db, terms, limit: 5 });
    }

    // Combine — Word context for technical, Excel for everything else
    const combinedContext = isTechnical
      ? [...wordContext, ...excelContext]
      : [...excelContext, ...wordContext];

    /* ════════════════════════════════════════════════════════════
       No records found
    ════════════════════════════════════════════════════════════ */
    if (combinedContext.length === 0) {
      return res.json(
        buildUserResponse({
          stage: "answer_ready",
          message:
            "I could not find this site or router in the available IMCAN sources. " +
            "Please check the router name or provide the country, city, airport, or site ID.",
          found_record: false,
          sources: [],
          results: [],
          attachments: [],
        })
      );
    }

    /* ════════════════════════════════════════════════════════════
       STATE: TARGET_FOUND
       Exactly one router matched, but no issue stated yet.
       Confirm the record and ask for the problem. NO LLM call.
    ════════════════════════════════════════════════════════════ */
    const topResult = combinedContext[0];

    // Multiple distinct routers → ask to narrow down
    const uniqueRouters = new Set(
      combinedContext
        .map((r: any) => r.current_versa_router_name || r.row_data?.["Router Name"] || r.row_data?.["Host Name"])
        .filter(Boolean)
    );
    if (uniqueRouters.size > 1 && !resolved_record) {
      const sourceSummary = combinedContext.slice(0, 3).map((r: any) => ({
        source_file: r.source_file,
        sheet_name: r.sheet_name,
        source_row_number: r.source_row_number,
      }));
      return res.json(
        buildUserResponse({
          stage: "waiting_for_target",
          message:
            "I found multiple matching records. Please provide the country, city, airport, or site ID to narrow the search.",
          found_record: false,
          sources: sourceSummary,
          results: [],
          attachments: [],
        })
      );
    }

    const hasIssueKeywords =
      question.split(" ").length > 3 ||
      /\?|problem|issue|down|fail|error|unreachable|cannot|can't|not.working|slow|latency|drop|circuit|escalat|contact|resolver|firmware|printer|vcom|xml|upgrade/i.test(
        question
      );

    if (!hasIssueKeywords && !isTechnical && !resolved_record) {
      const sources = combinedContext.slice(0, 3).map((r: any) => ({
        source_file: r.source_file,
        sheet_name: r.sheet_name,
        source_row_number: r.source_row_number,
        position: r.position,
      }));
      return res.json(
        buildUserResponse({
          stage: "waiting_for_issue",
          message: "I found the matching site and router record. What problem would you like me to investigate?",
          found_record: true,
          sources,
          results: [],
          attachments: [],
        })
      );
    }

    /* ════════════════════════════════════════════════════════════
       STATE: ANSWER_READY — call LLM with compact context
    ════════════════════════════════════════════════════════════ */
    const intent = detectIntent(question);
    const compactContext = combinedContext.slice(0, MAX_RESULTS).map((r: any) => toCompactResult(r, intent));

    const SYSTEM_PROMPT = `You are an English-only IMCAN Support Data Assistant.
All user-facing messages must be written in English. Never answer in Arabic, even when the user writes in Arabic.
Use only verified data from the retrieved database context. Never invent data, never use general knowledge.

STRICT RULES:
1. Never display old/legacy router names unless explicitly asked.
2. Never show boolean values (true/false). Convert to Yes/No if relevant, or omit entirely.
3. Never show null, undefined, empty objects, or raw JSON to users.
4. Never combine fields from different rows into one answer.
5. Every factual answer must cite: Source File, Sheet Name, and Original Row Number (or Document Position).
6. If the context does not contain the answer, respond exactly: "I could not find a matching record in the available IMCAN sources."
7. If partial match only: "I found a partial match, but the available data is not sufficient to confirm the correct record."
8. ALWAYS respond in English only, regardless of the language of the user's question.

RESPONSE FORMAT (English bullet points — omit any field that is empty, null, or false):
- Issue:
- Current Versa Router Name:
- Site:
- Country:
- City:
- Finding:
- Relevant Data:
- Contact or Resolver:
- Source File:
- Sheet:
- Original Row Number:
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

    const compactContextJson = JSON.stringify(compactContext);

    // Token safety gate — block if over limit
    const totalEstimatedTokens =
      estimateTokens(SYSTEM_PROMPT) +
      estimateTokens(question) +
      estimateTokens(compactContextJson) +
      4_000; // reserved for model answer

    console.log(`[IMCAN /chat] estimated input tokens: ${totalEstimatedTokens}, results: ${compactContext.length}`);

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
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Question: ${question}\n\nRetrieved Context (top ${compactContext.length} records, compact):\n${compactContextJson}`,
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
      try {
        parsed = JSON.parse(raw);
      } catch (_) { /* keep default */ }
    }

    // Enforce English on every LLM response before sending to client
    return res.json(buildUserResponse(parsed));
  } catch (e: any) {
    console.error("imcan/chat error", e);
    return res.status(500).json({ error: e.message });
  }
});
