import { getDb } from "./server/db";
import { onedriveFiles, onedriveIndexedData } from "./drizzle/schema";

async function run() {
  const db = await getDb();
  if (!db) return;
  const files = await db.select().from(onedriveFiles);
  console.log("OneDrive Files in DB:", files.map((f: any) => ({ name: f.name, status: f.status, sheetCount: f.sheetCount, indexedRows: f.indexedRows })));
  
  const data = await db.select().from(onedriveIndexedData).limit(2);
  console.log("Indexed Data sample:", data);
}
run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
