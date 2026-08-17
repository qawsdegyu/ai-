import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { onedriveFiles, onedriveIndexedData } from "../drizzle/schema";

export async function indexOneDriveFileBackground(driveItemId: string, accessToken: string) {
  try {
    const db = await getDb();
    if (!db) return;

    // Update status to processing
    await db.update(onedriveFiles)
      .set({ status: "processing", lastError: null })
      .where(eq(onedriveFiles.driveItemId, driveItemId));

    // Fetch file metadata
    const metaRes = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${driveItemId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!metaRes.ok) {
      throw new Error(`Failed to fetch metadata: ${metaRes.statusText}`);
    }

    const meta = await metaRes.json();
    const downloadUrl = meta["@microsoft.graph.downloadUrl"];
    
    if (!downloadUrl) {
      throw new Error("No download URL available. Is this a folder or an unsupported file?");
    }

    // Update metadata in DB
    await db.update(onedriveFiles)
      .set({ eTag: meta.eTag, lastModifiedDateTime: new Date(meta.lastModifiedDateTime), sizeBytes: meta.size })
      .where(eq(onedriveFiles.driveItemId, driveItemId));

    // Download and parse
    console.log(`[Indexer] Downloading ${meta.name}...`);
    const fileRes = await fetch(downloadUrl);
    const arrayBuffer = await fileRes.arrayBuffer();
    const XLSX = await import("xlsx");
    const workbook = XLSX.read(arrayBuffer, { type: "array" });

    let totalRows = 0;
    let totalCells = 0;

    // Ensure columns exist (auto-migration since we can't run drizzle push right now)
    const { sql } = await import("drizzle-orm");
    await db.execute(sql`ALTER TABLE onedrive_indexed_data ADD COLUMN IF NOT EXISTS "internalFileId" integer`);
    await db.execute(sql`ALTER TABLE onedrive_indexed_data ADD COLUMN IF NOT EXISTS "eTag" text`);
    await db.execute(sql`ALTER TABLE onedrive_indexed_data ADD COLUMN IF NOT EXISTS "fileName" text`);

    // Get internal file id
    const fileRecord = await db.select({ id: onedriveFiles.id }).from(onedriveFiles).where(eq(onedriveFiles.driveItemId, driveItemId)).limit(1);
    const internalFileId = fileRecord[0]?.id;

    // Clear old data for this file in chunks to prevent Neon DB timeouts for massive files
    while (true) {
      const result = await db.execute(sql`
        DELETE FROM onedrive_indexed_data 
        WHERE id IN (
          SELECT id FROM onedrive_indexed_data 
          WHERE "driveItemId" = ${driveItemId} 
          LIMIT 10000
        )
        RETURNING id
      `);
      // db.execute returns varying types depending on driver (array vs Result object)
      const res: any = result;
      if (!res || (Array.isArray(res) && res.length === 0) || res.rowCount === 0 || (res.rows && res.rows.length === 0)) {
        break;
      }
    }

    // Process sheets
    for (const sheetName of workbook.SheetNames) {
      const ws = workbook.Sheets[sheetName];
      if (!ws) continue;

      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) as any[][];
      
      const insertPayloads = [];
      
      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        const rowHasData = row.some(cell => cell !== "");
        if (!rowHasData) continue; // skip empty rows

        // Serialize row into cell addresses
        const cellData = row.map((val: any, c: number) => {
          if (val === "") return null;
          totalCells++;
          return `[${XLSX.utils.encode_cell({ c, r })}] ${val}`;
        }).filter(Boolean).join(" | ");

        if (cellData) {
          totalRows++;
          insertPayloads.push({
            internalFileId,
            driveItemId,
            eTag: meta.eTag,
            fileName: meta.name,
            sheetName,
            rowIndex: r + 1,
            cellAddress: `Row ${r + 1}`,
            content: cellData
          });
        }
      }

      // Batch insert rows (chunks of 1000)
      if (insertPayloads.length > 0) {
        for (let i = 0; i < insertPayloads.length; i += 1000) {
          await db.insert(onedriveIndexedData).values(insertPayloads.slice(i, i + 1000));
        }
      }
    }

    if (totalCells === 0) {
      throw new Error(`File was processed but 0 valid text cells were found. Check if the file is empty or unsupported.`);
    }

    // Final update
    await db.update(onedriveFiles)
      .set({ 
        status: "active", 
        sheetCount: workbook.SheetNames.length, 
        indexedRows: totalRows, 
        indexedCells: totalCells,
        lastSyncTime: new Date()
      })
      .where(eq(onedriveFiles.driveItemId, driveItemId));
      
    console.log(`[Indexer] Successfully indexed ${meta.name}: ${totalRows} rows, ${totalCells} cells.`);

  } catch (err: any) {
    console.error(`[Indexer] Failed to index ${driveItemId}:`, err);
    try {
      const db = await getDb();
      if (db) {
        await db.update(onedriveFiles)
          .set({ status: "failed", lastError: err.message })
          .where(eq(onedriveFiles.driveItemId, driveItemId));
      }
    } catch (e) {}
  }
}
