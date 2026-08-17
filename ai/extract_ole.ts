import AdmZip from 'adm-zip';
import * as CFB from 'cfb';
import * as fs from 'fs';

async function extractNativeOle() {
    console.log("Deep extracting Ole10Native objects properly...");
    try {
        const zip = new AdmZip('./ai/IMCAN EUC Sheet 2024.docx');
        
        const entries = zip.getEntries();
        for (const entry of entries) {
            const name = entry.entryName;
            if (name.includes('oleObject') && name.endsWith('.bin')) {
                const data = entry.getData();
                
                if (data.slice(0, 8).toString('hex').toUpperCase() === 'D0CF11E0A1B11AE1') {
                    try {
                        const cfb = CFB.read(data, { type: 'buffer' });
                        const nativeStream = CFB.find(cfb, '\x01Ole10Native') || CFB.find(cfb, 'Ole10Native');
                        
                        if (nativeStream) {
                            const buf = Buffer.from(nativeStream.content as any);
                            let offset = 4; // Skip initial size (4 bytes)

                            // Function to read null terminated string
                            const readString = () => {
                                let str = "";
                                while(offset < buf.length && buf[offset] !== 0) {
                                    str += String.fromCharCode(buf[offset]);
                                    offset++;
                                }
                                offset++; // skip null terminator
                                return str;
                            };

                            const label = readString();
                            const originalFileName = readString();
                            
                            // Skip the two 16-bit unknown fields
                            offset += 4;
                            
                            const commandPath = readString();
                            
                            // Now we are at the NativeDataSize2 (4 bytes, little endian)
                            const actualFileSize = buf.readUInt32LE(offset);
                            offset += 4;
                            
                            console.log(`\n======================================`);
                            console.log(`Analyzing ${name}`);
                            console.log(`- Label: ${label}`);
                            console.log(`- Original Filename: ${originalFileName}`);
                            console.log(`- Embedded File Size: ${(actualFileSize / 1024 / 1024).toFixed(2)} MB`);
                            
                            // Extract exact file data
                            const fileData = buf.slice(offset, offset + actualFileSize);
                            
                            const outPath = `./ai/extracted_${originalFileName || "unknown_file"}`;
                            fs.writeFileSync(outPath, fileData);
                            console.log(`[SUCCESS] Exact file extracted to: ${outPath}`);
                        }
                    } catch (err: any) {
                        console.log("Error parsing CFB:", err.message);
                    }
                }
            }
        }
    } catch (e: any) {
        console.error("Error:", e.message);
    }
}

extractNativeOle();
