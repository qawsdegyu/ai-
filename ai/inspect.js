const fs = require('fs');
const AdmZip = require('adm-zip');

try {
    const zip = new AdmZip('./ai/IMCAN EUC Sheet 2024.docx');
    console.log("Analyzing DOCX structure...");
    
    const entries = zip.getEntries();
    
    // Sort by size descending
    entries.sort((a, b) => b.header.size - a.header.size);
    
    console.log("\nTop 20 largest files inside the DOCX:");
    for (let i = 0; i < Math.min(20, entries.length); i++) {
        const entry = entries[i];
        console.log(`- ${entry.entryName} : ${(entry.header.size / 1024 / 1024).toFixed(2)} MB`);
    }
} catch (e) {
    console.error("Failed to read as ZIP:", e.message);
}
