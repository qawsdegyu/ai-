/**
 * contextBuilder.ts
 * ------------------
 * Shared utilities for building safe, compact LLM context payloads.
 *
 * Limits enforced here:
 *   - Max 5 DB results per search (hard cap 10)
 *   - Text fields truncated per-field limits
 *   - Total context target: 12,000 tokens
 *   - Hard safety limit: 20,000 tokens before any LLM call
 *   - Max 6 history messages + 1,500-char summary
 */

// ─── Token Estimation ────────────────────────────────────────────────────────

/**
 * Rough token estimate: ~4 characters per token (GPT-family heuristic).
 * Good enough for a safety gate; we do NOT need exact counts.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// ─── Truncation ──────────────────────────────────────────────────────────────

export function truncate(value: unknown, maxChars: number): string | undefined {
  if (value === null || value === undefined) return undefined;
  const str = String(value).trim();
  if (str === "" || str === "false" || str === "null" || str === "undefined") return undefined;
  return str.length > maxChars ? str.slice(0, maxChars) + "…" : str;
}

// ─── Field Selection (question-aware) ────────────────────────────────────────

type QuestionIntent =
  | "router_identity"
  | "router_outage"
  | "resolver"
  | "technical_procedure"
  | "general";

export function detectIntent(question: string): QuestionIntent {
  const q = question.toLowerCase();
  if (/printer|firmware|vcom|usb|xml|amadeus|atb|btp|configure|port|com|upgrade|driver/i.test(q))
    return "technical_procedure";
  if (/outage|down|fail|error|unreachable|not.respond|circuit|escalat|slow|latency|drop/i.test(q))
    return "router_outage";
  if (/resolver|email.*contact|phone|support.group|who.to.call|escalation.group/i.test(q))
    return "resolver";
  if (/router|site|vap|alias|what.is|identify|name/i.test(q))
    return "router_identity";
  return "general";
}

export interface CompactResult {
  source_file?: string;
  sheet_name?: string;
  source_row_number?: number;
  current_versa_router_name?: string;
  country?: string;
  city?: string;
  site_id?: string;
  summary?: string;
  subnet?: string;
  circuit?: string;
  status?: string;
  remarks?: string;
  full_site_address?: string;
  contact_details?: string;
  operational_hours?: string;
  content?: string;
  source_score?: number;
}

/**
 * Map a raw DB / search result row to a compact result with per-field limits.
 */
export function toCompactResult(
  row: Record<string, any>,
  intent: QuestionIntent
): CompactResult {
  // Common identity fields always included
  const base: CompactResult = {
    source_file: truncate(row.source_file ?? row.fileName ?? row.source, 120),
    sheet_name: truncate(row.sheet_name ?? row.sheetName, 80),
    source_row_number: typeof row.source_row_number === "number" ? row.source_row_number
      : typeof row.sourceRowNumber === "number" ? row.sourceRowNumber
      : undefined,
    current_versa_router_name: truncate(
      row.current_versa_router_name ??
        row.routerName ??
        row.row_data?.["Router Name"] ??
        row.row_data?.["Host Name"],
      120
    ),
    country: truncate(row.country ?? row.row_data?.["Country"], 80),
    city: truncate(row.city ?? row.row_data?.["City"], 80),
    site_id: truncate(row.site_id ?? row.siteId ?? row.row_data?.["Site ID"] ?? row.row_data?.["SITE ID"], 80),
    full_site_address: truncate(row.full_site_address ?? row.location ?? row.row_data?.["Full Site Address"], 1200),
    remarks: truncate(row.remarks ?? row.row_data?.["Remarks"] ?? row.row_data?.["Site Important Remarks"], 1500),
    content: truncate(row._raw ?? row.content, 4000),
    source_score: typeof row.score === "number" ? Math.round(row.score * 100) / 100 : undefined,
  };

  // Add extra fields based on intent
  if (intent === "router_outage" || intent === "general") {
    base.summary = truncate(
      row.summary ?? row.row_data?.["Summary"] ?? row.row_data?.["Circuit Type"],
      1500
    );
    base.subnet = truncate(row.subnet ?? row.subnetIp ?? row.row_data?.["Subnet IP"], 500);
    base.circuit = truncate(row.circuit ?? row.circuitType ?? row.row_data?.["Circuit Type"], 500);
    base.status = truncate(row.status ?? row.migrationStatus ?? row.row_data?.["MCS Status"], 500);
    base.contact_details = truncate(row.contact_details ?? row.contactDetails ?? row.row_data?.["Contact Details"], 1000);
    base.operational_hours = truncate(row.operational_hours ?? row.operationalHours ?? row.row_data?.["Operational Hours"], 500);
  }

  if (intent === "resolver") {
    base.contact_details = truncate(row.contact_details ?? row.contactDetails ?? row.row_data?.["Contact Details"], 1000);
    base.operational_hours = truncate(row.operational_hours ?? row.operationalHours ?? row.row_data?.["Operational Hours"], 500);
  }

  if (intent === "router_identity") {
    base.status = truncate(row.status ?? row.migrationStatus, 200);
  }

  // Remove undefined keys to keep payload small
  return Object.fromEntries(
    Object.entries(base).filter(([, v]) => v !== undefined && v !== null)
  ) as CompactResult;
}

// ─── Context Builder ─────────────────────────────────────────────────────────

export const CONTEXT_TARGET_TOKENS = 12_000;
export const CONTEXT_HARD_LIMIT_TOKENS = 20_000;
export const MAX_RESULTS = 5;
export const MAX_CLIENT_LIMIT = 10;

export interface BuiltContext {
  contextJson: string;
  estimatedTokens: number;
  resultCount: number;
  wasTruncated: boolean;
}

export function buildContext(
  results: Record<string, any>[],
  historySummary: string,
  userQuestion: string
): BuiltContext {
  const intent = detectIntent(userQuestion);

  // Hard-cap results
  const sliced = results.slice(0, MAX_RESULTS);
  const compactResults = sliced.map((r) => toCompactResult(r, intent));

  const payload = {
    question: userQuestion.slice(0, 500),
    history_summary: truncate(historySummary, 1500) ?? "",
    results: compactResults,
  };

  let contextJson = JSON.stringify(payload);
  let tokens = estimateTokens(contextJson);
  let wasTruncated = false;

  // Stage 1: target reduction — drop optional heavy fields
  if (tokens > CONTEXT_TARGET_TOKENS) {
    wasTruncated = true;
    const reduced = compactResults.map((r) => ({
      source_file: r.source_file,
      sheet_name: r.sheet_name,
      source_row_number: r.source_row_number,
      current_versa_router_name: r.current_versa_router_name,
      country: r.country,
      city: r.city,
      site_id: r.site_id,
      summary: r.summary ? r.summary.slice(0, 500) : undefined,
      remarks: r.remarks ? r.remarks.slice(0, 500) : undefined,
      full_site_address: r.full_site_address ? r.full_site_address.slice(0, 800) : undefined,
      content: r.content ? r.content.slice(0, 3000) : undefined,
      source_score: r.source_score,
    }));
    contextJson = JSON.stringify({ question: payload.question, history_summary: payload.history_summary, results: reduced });
    tokens = estimateTokens(contextJson);
  }

  // Stage 2: hard safety — brute-force character truncation
  if (tokens > CONTEXT_HARD_LIMIT_TOKENS) {
    wasTruncated = true;
    const maxChars = CONTEXT_HARD_LIMIT_TOKENS * 4;
    contextJson = contextJson.slice(0, maxChars) + '"]}'; // best-effort close
    tokens = estimateTokens(contextJson);
  }

  return { contextJson, estimatedTokens: tokens, resultCount: compactResults.length, wasTruncated };
}

// ─── Conversation History Compactor ─────────────────────────────────────────

export const MAX_HISTORY_MESSAGES = 6;
export const MAX_HISTORY_SUMMARY_CHARS = 1_500;

export function compactHistory(
  messages: Array<{ role: string; content: string }>,
  maxMessages = MAX_HISTORY_MESSAGES
): { recentText: string; summary: string } {
  if (!messages || messages.length === 0) return { recentText: "", summary: "" };

  const recent = messages.slice(-maxMessages);
  const recentText = recent
    .map((m) => `${m.role === "user" ? "Employee" : "Assistant"}: ${m.content.slice(0, 600)}`)
    .join("\n\n");

  // Build a one-liner summary from older messages
  const older = messages.slice(0, Math.max(0, messages.length - maxMessages));
  const summaryRaw = older
    .filter((m) => m.role === "user")
    .map((m) => m.content.slice(0, 200))
    .join("; ");
  const summary = summaryRaw.slice(0, MAX_HISTORY_SUMMARY_CHARS);

  return { recentText, summary };
}

// ─── Clarification Response ──────────────────────────────────────────────────

export const TOO_LARGE_CONTEXT_MESSAGE =
  "I found too much data for one response. Please provide the site, router name, city, country, or site ID so I can narrow the search.";
