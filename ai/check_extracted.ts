import * as xlsx from 'xlsx';
import * as fs from 'fs';

async function checkExtracted() {
    try {
        console.log("Checking extracted_oleObject1.zip_or_xlsx ...");
        if (fs.existsSync('./ai/extracted_oleObject1.zip_or_xlsx')) {
            const data = fs.readFileSync('./ai/extracted_oleObject1.zip_or_xlsx');
            const workbook = xlsx.read(data, { type: 'buffer' });
            console.log("Sheets in oleObject1:", workbook.SheetNames);
        }
        
        console.log("\nChecking extracted_oleObject4.zip_or_xlsx ...");
        if (fs.existsSync('./ai/extracted_oleObject4.zip_or_xlsx')) {
            const data = fs.readFileSync('./ai/extracted_oleObject4.zip_or_xlsx');
            const workbook = xlsx.read(data, { type: 'buffer' });
            console.log("Sheets in oleObject4:", workbook.SheetNames);
        }
    } catch (err: any) {
        console.log("Error reading file:", err.message);
    }
}

checkExtracted();
