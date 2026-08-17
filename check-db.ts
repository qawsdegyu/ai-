import { getDb } from "./server/db";
import { onedriveIndexedData } from "./drizzle/schema";
import { ilike } from "drizzle-orm";

async function run() {
  const q = "%vtoalysv01%";
  const db = await getDb();
  if (!db) return;
  const res = await db.select().from(onedriveIndexedData).where(ilike(onedriveIndexedData.content, q));
  console.log(`Found ${res.length} rows containing ${q}`);
  if (res.length > 0) {
    console.log("First row:", res[0].content);
  }
}
run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
