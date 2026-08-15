const { db } = require('./server/db');
const { onedriveIndexedData } = require('./drizzle/schema');
const { eq } = require('drizzle-orm');

async function test() {
    const data = await db.select().from(onedriveIndexedData).limit(10);
    console.log(data.map(d => d.content));
    process.exit(0);
}
test().catch(console.error);
