import { Router } from "express";
import { getDb } from "./db";
import { imcanRows, imcanDocumentItems, imcanDocumentAssets, imcanSources } from "../drizzle/schema";
import { eq, or, sql, ilike, inArray, and } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";

export const imcanRouter = Router();

const NEW_INVENTORY_HASH = '5aad8e9ef455c77a708788d43cbb4e374aefca9044e6a0a0ea2333b917bc4ae0';

// /api/new-inventory/search
imcanRouter.post("/new-inventory/search", async (req, res) => {
  try {
    const { query, sheet, limit = 10 } = req.body;
    if (!query) return res.status(400).json({ error: "Missing query" });

    const db = await getDb();
    if (!db) return res.status(500).json({ error: "No DB" });

    const cleanQuery = query.replace(/\s+/g, " ").trim().toLowerCase();
    const sqlSearchTerms = cleanQuery.split(" ").filter((w: string) => w.length > 2);
    
    if (sqlSearchTerms.length === 0) return res.json({ results: [] });
    
    const tsQueryStr = sqlSearchTerms.join(" | ");

    const newSource = await db.select().from(imcanSources).where(eq(imcanSources.hash, NEW_INVENTORY_HASH)).limit(1);
    if (!newSource || newSource.length === 0) {
       return res.json({ results: [] });
    }

    const excelSearchVectorQuery = sql`search_vector @@ to_tsquery('arabic', ${tsQueryStr})`;
    const excelLikeConditions = sqlSearchTerms.map((term: string) => ilike(imcanRows.searchText, `%${term}%`));
    
    const baseCondition = or(excelSearchVectorQuery, ...excelLikeConditions);
    const finalCondition = sheet 
      ? and(eq(imcanRows.sourceId, newSource[0].id), ilike(imcanRows.sheetName, `%${sheet}%`), baseCondition)
      : and(eq(imcanRows.sourceId, newSource[0].id), baseCondition);

    const rawExcel = await db.select().from(imcanRows).where(finalCondition).limit(limit);
    
    const results = rawExcel.map(r => ({
      file_name: newSource[0].fileName || "NewInventory.xlsx",
      version_label: newSource[0].version || "NewInventory",
      sheet_name: r.sheetName,
      source_row_number: r.sourceRowNumber,
      row_data: r.rowData,
      score: 1.0
    }));

    return res.json({ results });
  } catch (e: any) {
    console.error("New Inventory Search API error", e);
    return res.status(500).json({ error: e.message });
  }
});

// /api/imcan/search
imcanRouter.post("/search", async (req, res) => {
  try {
    const { query, sheet, limit = 10 } = req.body;
    if (!query) return res.status(400).json({ error: "Missing query" });

    const db = await getDb();
    if (!db) return res.status(500).json({ error: "No DB" });

    // 1. Clean query
    const cleanQuery = query.replace(/\s+/g, " ").trim().toLowerCase();
    const sqlSearchTerms = cleanQuery.split(" ").filter((w: string) => w.length > 2);
    
    // 2. Determine priority
    const wordKeywords = ["printer", "firmware", "vcom", "xml", "configure", "amadeus"];
    const excelKeywords = ["موقع", "router", "country", "city", "vlan", "dns", "resolver", "contact", "asset verification", "escalation"];
    
    let priority = "mixed";
    if (sqlSearchTerms.some((t: string) => wordKeywords.includes(t))) priority = "word";
    if (sqlSearchTerms.some((t: string) => excelKeywords.includes(t))) priority = "excel";

    let excelResults: any[] = [];
    let wordResults: any[] = [];

    if (sqlSearchTerms.length > 0) {
      const tsQueryStr = sqlSearchTerms.join(" | ");

      // --- Search Excel ---
      const excelSearchVectorQuery = sql`search_vector @@ to_tsquery('arabic', ${tsQueryStr})`;
      const excelLikeConditions = sqlSearchTerms.map((term: string) => ilike(imcanRows.searchText, `%${term}%`));
      
      const baseCondition = or(excelSearchVectorQuery, ...excelLikeConditions);
      const excelCondition = sheet 
         ? and(ilike(imcanRows.sheetName, `%${sheet}%`), baseCondition)
         : baseCondition;
         
      const rawExcel = await db.select({
         row: imcanRows,
         source: imcanSources
      })
      .from(imcanRows)
      .leftJoin(imcanSources, eq(imcanRows.sourceId, imcanSources.id))
      .where(excelCondition)
      .limit(limit);
      
      excelResults = rawExcel.map(({ row: r, source: s }) => ({
        type: "excel_row",
        source: s ? (s.fileName || "Excel Database") : "Excel Database",
        file_name: s ? s.fileName : undefined,
        version_label: s ? s.version : undefined,
        sheet_name: r.sheetName,
        position: r.sourceRowNumber,
        text: JSON.stringify(r.rowData),
        assets: [],
        score: priority === "excel" ? 1.0 : 0.5
      }));

      // --- Search Word Document Items ---
      const wordSearchVectorQuery = sql`search_vector @@ to_tsquery('arabic', ${tsQueryStr})`;
      const wordLikeConditions = sqlSearchTerms.map((term: string) => ilike(imcanDocumentItems.contentText, `%${term}%`));
      
      const wordCondition = or(wordSearchVectorQuery, ...wordLikeConditions);
      const rawWord = await db.select().from(imcanDocumentItems).where(wordCondition).limit(limit);

      // Fetch assets if needed
      const matchedDocIds = Array.from(new Set(rawWord.map(r => r.documentId).filter(Boolean)));
      let assetsMap = new Map();
      if (matchedDocIds.length > 0) {
        const assets = await db.select().from(imcanDocumentAssets).where(inArray(imcanDocumentAssets.documentId, matchedDocIds as number[]));
        assets.forEach(a => {
           const positions = (a.relatedItemPositions as number[]) || [];
           positions.forEach(pos => {
              const key = `${a.documentId}-${pos}`;
              if (!assetsMap.has(key)) assetsMap.set(key, []);
              assetsMap.get(key).push({
                 asset_name: a.assetName,
                 asset_kind: a.assetKind,
                 mime_type: a.mimeType,
                 cdn_url: a.cdnUrl
              });
           });
        });
      }

      wordResults = rawWord.map(r => ({
        type: "document_item",
        source: "IMCANEUCSheet2024.docx",
        sheet_name: null,
        position: r.position,
        text: r.contentText,
        assets: assetsMap.get(`${r.documentId}-${r.position}`) || [],
        score: priority === "word" ? 1.0 : 0.5
      }));
    }

    // 5 & 6. Sort and Limit
    let combined = [...wordResults, ...excelResults].sort((a, b) => b.score - a.score).slice(0, limit);

    return res.json({ results: combined });
  } catch (e: any) {
    console.error("Search API error", e);
    return res.status(500).json({ error: e.message });
  }
});

// /api/imcan/chat
imcanRouter.post("/chat", async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: "Missing question" });

    // Re-use search logic (could be abstracted, but keeping it inline for simplicity)
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "No DB" });

    const cleanQuery = question.replace(/\s+/g, " ").trim().toLowerCase();
    const sqlSearchTerms = cleanQuery.split(" ").filter((w: string) => w.length > 2);
    
    const wordKeywords = ["printer", "firmware", "vcom", "xml", "configure", "amadeus"];
    const excelKeywords = ["موقع", "router", "country", "city", "vlan", "dns", "resolver", "contact", "asset verification", "escalation"];
    
    let priority = "mixed";
    if (sqlSearchTerms.some((t: string) => wordKeywords.includes(t))) priority = "word";
    if (sqlSearchTerms.some((t: string) => excelKeywords.includes(t))) priority = "excel";

    let combinedContext: any[] = [];
    if (sqlSearchTerms.length > 0) {
      const tsQueryStr = sqlSearchTerms.join(" | ");

      // Search Word
      const wordSearchVectorQuery = sql`search_vector @@ to_tsquery('arabic', ${tsQueryStr})`;
      const wordLikeConditions = sqlSearchTerms.map((term: string) => ilike(imcanDocumentItems.contentText, `%${term}%`));
      const rawWord = await db.select().from(imcanDocumentItems).where(or(wordSearchVectorQuery, ...wordLikeConditions)).limit(10);

      const matchedDocIds = Array.from(new Set(rawWord.map(r => r.documentId).filter(Boolean)));
      let assetsMap = new Map();
      if (matchedDocIds.length > 0) {
        const assets = await db.select().from(imcanDocumentAssets).where(inArray(imcanDocumentAssets.documentId, matchedDocIds as number[]));
        assets.forEach(a => {
           const positions = (a.relatedItemPositions as number[]) || [];
           positions.forEach(pos => {
              const key = `${a.documentId}-${pos}`;
              if (!assetsMap.has(key)) assetsMap.set(key, []);
              assetsMap.get(key).push({
                 asset_name: a.assetName,
                 asset_kind: a.assetKind,
                 mime_type: a.mimeType,
                 cdn_url: a.cdnUrl
              });
           });
        });
      }

      const wordResults = rawWord.map(r => ({
        type: "word_document",
        file_name: "IMCANEUCSheet2024.docx",
        position: r.position,
        text: r.contentText,
        assets: assetsMap.get(`${r.documentId}-${r.position}`) || [],
        score: priority === "word" ? 1.0 : 0.5
      }));

      // Search Excel
      const excelSearchVectorQuery = sql`search_vector @@ to_tsquery('arabic', ${tsQueryStr})`;
      const excelLikeConditions = sqlSearchTerms.map((term: string) => ilike(imcanRows.searchText, `%${term}%`));
      const excelCondition = or(excelSearchVectorQuery, ...excelLikeConditions);
      
      let rawExcel = await db.select({
         row: imcanRows,
         source: imcanSources
      })
      .from(imcanRows)
      .leftJoin(imcanSources, eq(imcanRows.sourceId, imcanSources.id))
      .where(excelCondition)
      .limit(20); // fetch more to filter down
      
      const asksForNew = cleanQuery.includes("new") || cleanQuery.includes("latest") || cleanQuery.includes("أحدث") || cleanQuery.includes("جديد");
      const asksForOld = cleanQuery.includes("old") || cleanQuery.includes("reference") || cleanQuery.includes("قديم") || cleanQuery.includes("سابق");
      
      if (asksForNew) {
         rawExcel = rawExcel.filter(r => r.source?.hash === NEW_INVENTORY_HASH);
      } else if (asksForOld) {
         rawExcel = rawExcel.filter(r => r.source?.hash !== NEW_INVENTORY_HASH);
      }
      
      const excelResults = rawExcel.slice(0, 10).map(({ row: r, source: s }) => ({
        type: "excel",
        file_name: s ? s.fileName : "Unknown Excel",
        version_label: s ? s.version : "Unknown Version",
        sheet_name: r.sheetName,
        row_number: r.sourceRowNumber,
        text: JSON.stringify(r.rowData),
        score: priority === "excel" ? 1.0 : 0.5
      }));

      combinedContext = [...wordResults, ...excelResults].sort((a, b) => b.score - a.score).slice(0, 10);
    }

    if (combinedContext.length === 0) {
      return res.json({
         message: "I could not find this information in the available IMCAN sources.",
         language: "en",
         stage: "answer_ready",
         found_record: false,
         sources: [],
         results: [],
         attachments: []
      });
    }

    const systemPrompt = `You are an English-only Support Data Assistant for IMCAN.
You must use the provided JSON context to answer. Do not use general knowledge or invent anything.
All user-facing text must be in English ONLY. If the user asks in Arabic, translate internally and respond in English.

WORKFLOW RULES:
1. Identify if the user provided a site, router, airport, city, country, subnet, or circuit.
2. If NO identifier is provided, return:
   message: "Which site, airport, router, or inventory record should I search in the latest NewInventory file?"
   stage: "awaiting_issue", found_record: false
3. If an identifier IS provided but NO problem/issue is stated, return:
   message: "I found the matching record in [Source File]. What problem would you like me to investigate?"
   stage: "awaiting_issue", found_record: true, sources: [list of matched sources]
4. If BOTH an identifier AND a problem are provided, return the final answer formatted strictly as English bullet points:
   - Issue:
   - Site / Router:
   - Finding:
   - Action or procedure found in the source:
   - Contact or resolver group:
   - Source file:
   - Sheet or document section:
   - Original row number or document position:
   - Related image or attachment:
   - Confidence:
   Omit empty bullets. stage: "answer_ready".
5. If the information is not present in the context, return message: "I could not find this information in the available IMCAN sources."
6. If the search result is incomplete, return message: "I found a partial match, but the available data is not sufficient to confirm the answer."

You MUST return a JSON object matching this exact schema:
{
  "message": "The English response text",
  "language": "en",
  "stage": "awaiting_issue" | "answer_ready",
  "found_record": boolean,
  "sources": [{ "file_name": string, "sheet_name"?: string, "source_row_number"?: number, "position"?: number }],
  "results": [],
  "attachments": [{ "asset_name": string, "mime_type": string, "url": string, "reason": string }]
}`;

    const llmResponse = await invokeLLM({
      model: "openai/gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Question: ${question}\n\nContext Data:\n${JSON.stringify(combinedContext, null, 2)}` }
      ],
      response_format: { type: "json_object" }
    });

    const content = llmResponse.choices[0]?.message?.content;
    let parsed = { 
       message: "Error reading response.", 
       language: "en", 
       stage: "answer_ready", 
       found_record: false, 
       sources: [], 
       results: [], 
       attachments: [] 
    };
    
    if (typeof content === "string") {
       try {
         parsed = JSON.parse(content);
       } catch(e) {}
    }

    return res.json(parsed);

  } catch (e: any) {
    console.error("Chat API error", e);
    return res.status(500).json({ error: e.message });
  }
});
