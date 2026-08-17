import fs from 'fs';
import xlsx from 'xlsx';
import { execSync } from 'child_process';

const SQL_FILE = './ai/database_seed.sql';

async function main() {
    console.log("🚀 Starting comprehensive SQL generation for AI data with Image Support...");
    let sqlOutput = `-- Auto-generated SQL script for AI Knowledge Base\n\n`;

    sqlOutput += `
-- =========================================
-- 1. DATABASE SCHEMA
-- =========================================
CREATE TABLE IF NOT EXISTS imcan_reference_data (
    id SERIAL PRIMARY KEY,
    sheet_name TEXT,
    row_index INTEGER,
    item_name TEXT,
    category TEXT,
    full_data JSONB
);

CREATE TABLE IF NOT EXISTS imcan_euc_images (
    id SERIAL PRIMARY KEY,
    content_type TEXT,
    base64_data TEXT
);

CREATE TABLE IF NOT EXISTS imcan_euc_data (
    id SERIAL PRIMARY KEY,
    document_name TEXT,
    content_chunk TEXT
);

-- Clear old data
TRUNCATE TABLE imcan_reference_data RESTART IDENTITY;
TRUNCATE TABLE imcan_euc_images RESTART IDENTITY;
TRUNCATE TABLE imcan_euc_data RESTART IDENTITY;

`;

    // ==========================================
    // 2. EXCEL PARSING
    // ==========================================
    console.log("📊 Parsing Excel reference sheet...");
    try {
        const workbook = xlsx.readFile('./ai/IMCAN-Reference-Sheet---2024.xlsm');
        for (const sheetName of workbook.SheetNames) {
            const sheet = workbook.Sheets[sheetName];
            const rows = xlsx.utils.sheet_to_json(sheet, { defval: null });
            
            if (rows.length === 0) continue;
            console.log(`   -> Processing Excel sheet: ${sheetName} (${rows.length} rows)`);
            
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const keys = Object.keys(row);
                
                let itemName = row['Name'] || row['Item'] || row['Device'] || row['اسم'] || row['Title'] || (keys.length > 0 ? row[keys[0]] : 'Unknown');
                let category = row['Category'] || row['Issue'] || row['Network'] || row['Problem'] || row['Type'] || 'General';
                
                itemName = String(itemName).replace(/'/g, "''");
                category = String(category).replace(/'/g, "''");
                const fullDataJson = JSON.stringify(row).replace(/'/g, "''");
                
                sqlOutput += `INSERT INTO imcan_reference_data (sheet_name, row_index, item_name, category, full_data) VALUES ('${sheetName.replace(/'/g, "''")}', ${i+1}, '${itemName}', '${category}', '${fullDataJson}');\n`;
            }
        }
    } catch (e) {
        console.error("❌ Error parsing Excel:", e);
    }

    // ==========================================
    // 3. WORD DOCUMENT & IMAGE PARSING
    // ==========================================
    console.log("\n📄 Parsing Word document and extracting images...");
    try {
        let mammoth;
        let TurndownService;
        try {
            mammoth = await import('mammoth');
            TurndownService = (await import('turndown')).default;
        } catch (e) {
            console.log("   -> Required libraries not found. Installing mammoth and turndown...");
            execSync('npm install mammoth turndown --no-save', { stdio: 'inherit' });
            mammoth = await import('mammoth');
            TurndownService = (await import('turndown')).default;
        }
        
        const turndownService = new TurndownService();
        
        const mammothExport = mammoth.default || mammoth;
        
        let imageCounter = 1;
        
        const options = {
            convertImage: mammothExport.images.inline(async function(element) {
                const buffer = await element.read();
                const base64 = buffer.toString('base64');
                const contentType = element.contentType;
                
                const id = imageCounter++;
                // Insert the image into the DB. The AI won't see this base64 string, saving tokens!
                sqlOutput += `INSERT INTO imcan_euc_images (id, content_type, base64_data) VALUES (${id}, '${contentType}', '${base64}');\n`;
                
                // Return a clean URL that the frontend will use to fetch the image later
                return { src: `/api/ai-images/${id}` };
            })
        };

        console.log("   -> Extracting content and images from document...");
        const result = await mammothExport.convertToHtml({ path: './ai/IMCAN EUC Sheet 2024.docx' }, options);
        let html = result.value;
        
        // Convert the HTML to Markdown so the AI can read it perfectly
        console.log("   -> Converting HTML to Markdown for AI...");
        const markdown = turndownService.turndown(html);
        
        // Chunk the massive text into segments
        const chunkSize = 3000;
        let chunksCount = 0;
        for (let i = 0; i < markdown.length; i += chunkSize) {
            const chunk = markdown.slice(i, i + chunkSize).replace(/'/g, "''");
            sqlOutput += `INSERT INTO imcan_euc_data (document_name, content_chunk) VALUES ('IMCAN EUC Sheet 2024.docx', '${chunk}');\n`;
            chunksCount++;
        }
        
        // Reset sequence so auto-increment works if you add more images later
        sqlOutput += `SELECT setval('imcan_euc_images_id_seq', (SELECT MAX(id) FROM imcan_euc_images));\n`;
        
        console.log(`   -> Extracted ${imageCounter - 1} images and created ${chunksCount} text chunks.`);
    } catch (e) {
        console.error("❌ Error parsing Word file:", e);
        sqlOutput += `-- Error parsing Word file: ${e.message}\n`;
    }

    // ==========================================
    // 4. WRITE TO SQL FILE
    // ==========================================
    fs.writeFileSync(SQL_FILE, sqlOutput);
    console.log(`\n✅ SQL file successfully generated at: ${SQL_FILE}`);
    console.log(`\n🎯 Next Step:`);
    console.log(`1. Copy the contents of ${SQL_FILE}`);
    console.log(`2. Run it in your Supabase SQL Editor.`);
    console.log(`3. (Optional) If the file is too large for the Supabase editor, you can run it via psql command line.`);
}

main();
