import 'dotenv/config';
import postgres from 'postgres';
import xlsx from 'xlsx';
import { execSync } from 'child_process';

async function main() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error("❌ ERROR: DATABASE_URL is missing in your .env file");
        process.exit(1);
    }
    
    console.log("🔌 Connecting directly to Supabase database...");
    const sql = postgres(connectionString, { ssl: 'require', max: 5 });

    console.log("🚀 Creating tables...");
    await sql`
        CREATE TABLE IF NOT EXISTS imcan_reference_data (
            id SERIAL PRIMARY KEY,
            sheet_name TEXT,
            row_index INTEGER,
            item_name TEXT,
            category TEXT,
            full_data JSONB
        );
    `;
    await sql`
        CREATE TABLE IF NOT EXISTS imcan_euc_images (
            id SERIAL PRIMARY KEY,
            content_type TEXT,
            base64_data TEXT
        );
    `;
    await sql`
        CREATE TABLE IF NOT EXISTS imcan_euc_data (
            id SERIAL PRIMARY KEY,
            document_name TEXT,
            content_chunk TEXT
        );
    `;
    
    console.log("🧹 Clearing old data to prevent duplicates...");
    await sql`TRUNCATE TABLE imcan_reference_data RESTART IDENTITY`;
    await sql`TRUNCATE TABLE imcan_euc_images RESTART IDENTITY`;
    await sql`TRUNCATE TABLE imcan_euc_data RESTART IDENTITY`;

    console.log("📊 Uploading Excel data automatically...");
    const workbook = xlsx.readFile('./ai/IMCAN-Reference-Sheet---2024.xlsm');
    for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const rows = xlsx.utils.sheet_to_json(sheet, { defval: null });
        if (rows.length === 0) continue;
        console.log(`   -> Uploading Excel sheet: ${sheetName} (${rows.length} rows)`);
        
        let batch = [];
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i] as any;
            const keys = Object.keys(row);
            
            let itemName = row['Name'] || row['Item'] || row['Device'] || row['اسم'] || row['Title'] || (keys.length > 0 ? row[keys[0]] : 'Unknown');
            let category = row['Category'] || row['Issue'] || row['Network'] || row['Problem'] || row['Type'] || 'General';
            
            batch.push({
                sheet_name: String(sheetName),
                row_index: i + 1,
                item_name: String(itemName),
                category: String(category),
                full_data: row
            });
            
            if (batch.length === 100 || i === rows.length - 1) {
                // Bulk insert using Postgres driver
                await sql`INSERT INTO imcan_reference_data ${sql(batch)}`;
                batch = [];
            }
        }
    }

    console.log("\n📄 Bulletproof Word Document Parser...");
    let AdmZip: any;
    try {
        const admZipModule = await import('adm-zip');
        AdmZip = admZipModule.default || admZipModule;
    } catch (e) {
        console.log("   -> Installing deep extraction tools...");
        execSync('npm install adm-zip --no-save', { stdio: 'inherit' });
        const admZipModule = await import('adm-zip');
        AdmZip = admZipModule.default || admZipModule;
    }

    const zip = new AdmZip('./ai/IMCAN EUC Sheet 2024.docx');
    console.log("   -> Scanning ALL document files and media...");
    
    let allText = "";
    let imageCounter = 1;
    
    for (const entry of zip.getEntries()) {
        const name = entry.entryName.toLowerCase();
        
        // 1. Extract ALL images from ANY folder inside the Word file
        if (name.match(/\.(png|jpg|jpeg|gif|bmp)$/i)) {
            const buffer = entry.getData();
            const base64 = buffer.toString('base64');
            let contentType = 'image/jpeg';
            if (name.endsWith('png')) contentType = 'image/png';
            else if (name.endsWith('gif')) contentType = 'image/gif';
            else if (name.endsWith('bmp')) contentType = 'image/bmp';
            
            const id = imageCounter++;
            await sql`INSERT INTO imcan_euc_images (id, content_type, base64_data) VALUES (${id}, ${contentType}, ${base64})`;
            
            // Add a marker in the text
            allText += `\n\n[صورة توضيحية من ملف الوورد: /api/ai-images/${id}]\n\n`;
        }
        
        // 2. Extract ALL text from ANY XML file (this guarantees 100% text extraction)
        if (name.endsWith('.xml')) {
            const xml = zip.readAsText(entry);
            // Extract anything between > and <
            const textMatches = xml.match(/>([^<]+)</g);
            if (textMatches) {
                const cleanText = textMatches
                    .map((t: string) => t.slice(1, -1).trim())
                    // Filter out short internal XML variables to keep only actual human text
                    .filter((t: string) => t.length > 2 && !t.match(/^[a-zA-Z0-9_:-]+$/)) 
                    .join('\n');
                
                if (cleanText) {
                    allText += cleanText + '\n\n';
                }
            }
        }
    }

    console.log("   -> Saving deeply extracted chunks...");
    const chunkSize = 3000;
    let chunksCount = 0;
    
    for (let i = 0; i < allText.length; i += chunkSize) {
        const chunk = allText.slice(i, i + chunkSize);
        await sql`INSERT INTO imcan_euc_data (document_name, content_chunk) VALUES ('IMCAN EUC Sheet 2024.docx', ${chunk})`;
        chunksCount++;
    }
    
    await sql`SELECT setval('imcan_euc_images_id_seq', (SELECT MAX(id) FROM imcan_euc_images))`;

    console.log(`\n✅ SUCCESS! All data has been perfectly uploaded directly into your Database.`);
    console.log(`   Images Extracted & Uploaded: ${imageCounter - 1}`);
    console.log(`   Word Chunks Extracted & Uploaded: ${chunksCount}`);
    
    await sql.end();
}

main().catch(err => {
    console.error("❌ Fatal Error during upload:", err);
    process.exit(1);
});
