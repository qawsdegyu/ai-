import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerMicrosoftOAuthRoutes } from "../microsoftOAuth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerMicrosoftOAuthRoutes(app);
  
  app.get("/api/knowledge/debug/search", async (req, res) => {
    const drive_item_id = req.query.drive_item_id as string;
    const q = req.query.q as string;
    
    if (!drive_item_id || !q) {
      return res.status(400).json({ error: "Missing drive_item_id or q" });
    }
    
    try {
      const { getDb } = await import("../db");
      const { onedriveIndexedData } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "No DB" });
      
      const debugResult = {
        all_indexed_cells: 0,
        cells_filtered_by_internal_file_id: 0,
        cells_filtered_by_drive_item_id: 0,
        non_empty_cells: 0,
        raw_text_matches: 0,
        normalized_text_matches: 0,
        sheet_matches: 0,
        final_matches: 0,
        searched_cells: 0,
        matched_cells: 0,
        matches_per_sheet: {} as Record<string, number>,
        matches: [] as any[],
        drop_reason: ""
      };
      
      const allTableData = await db.select().from(onedriveIndexedData);
      debugResult.all_indexed_cells = allTableData.length;
      
      const fileData = allTableData.filter(r => r.driveItemId === drive_item_id);
      debugResult.cells_filtered_by_drive_item_id = fileData.length;
      debugResult.cells_filtered_by_internal_file_id = fileData.length; // Same since we filter by drive_item_id
      
      if (fileData.length === 0) {
        debugResult.drop_reason = "Dropped at drive_item_id filter. No cells match this ID.";
        return res.json(debugResult);
      }
      
      const normalizeText = (value: any) => {
        return String(value ?? '')
          .normalize('NFC')
          .toLowerCase()
          .replace(/[أإآ]/g, 'ا')
          .replace(/[ًٌٍَُِّْـ]/g, '')
          .replace(/\s+/g, ' ')
          .trim();
      };
      
      const queryNorm = normalizeText(q);
      const queryRaw = String(q).toLowerCase();
      
      for (const row of fileData) {
        if (!row.content || row.content.trim() === "") continue;
        debugResult.non_empty_cells++;
        
        const normContent = normalizeText(row.content);
        const rawContent = String(row.content).toLowerCase();
        
        const matchedRaw = rawContent.includes(queryRaw);
        const matchedNorm = normContent.includes(queryNorm);
        
        if (matchedRaw) debugResult.raw_text_matches++;
        if (matchedNorm) debugResult.normalized_text_matches++;
        
        // Since we don't filter by sheet in this debug endpoint, all that pass text pass sheet
        let pass = matchedRaw || matchedNorm;
        
        if (pass) {
          debugResult.sheet_matches++;
          debugResult.final_matches++;
          debugResult.matches_per_sheet[row.sheetName] = (debugResult.matches_per_sheet[row.sheetName] || 0) + 1;
          
          if (debugResult.matches.length < 50) {
            debugResult.matches.push({
              internal_file_id: row.internalFileId || "unknown",
              drive_item_id: row.driveItemId,
              etag: row.eTag || "unknown",
              file_name: row.fileName || "unknown",
              sheet_name: row.sheetName,
              cell_address: row.cellAddress,
              raw_value: row.content,
              normalized_text: normContent
            });
          }
        }
      }
      
      debugResult.searched_cells = debugResult.non_empty_cells;
      debugResult.matched_cells = debugResult.final_matches;
      
      if (debugResult.final_matches === 0) {
        debugResult.drop_reason = `Searched ${debugResult.non_empty_cells} non-empty cells but found 0 matches. The word might not exist, or normalizeText wiped it out.`;
      }
      
      return res.json(debugResult);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
