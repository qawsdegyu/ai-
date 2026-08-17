const { db } = require('./server/db');
const { onedriveIndexedData } = require('./drizzle/schema');
const { eq } = require('drizzle-orm');

async function test() {
    try {
        await db.delete(onedriveIndexedData).where(eq(onedriveIndexedData.driveItemId, '1R067R5RD9804DDFbb5d52da58290a90299abacd9aec8056'));
        console.log("Delete success");
    } catch (e) {
        console.error("FULL ERROR:", e);
    }
    process.exit(0);
}
test();
