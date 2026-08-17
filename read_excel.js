import * as xlsx from 'xlsx';

const workbook = xlsx.readFile('ai/IMCAN-Reference-Sheet---2024.xlsm');
console.log("Sheets:", workbook.SheetNames);

for (const sheetName of workbook.SheetNames.slice(0, 3)) {
  console.log(`\n--- Sheet: ${sheetName} ---`);
  const sheet = workbook.Sheets[sheetName];
  const json = xlsx.utils.sheet_to_json(sheet, { defval: '' });
  console.log(`Total rows: ${json.length}`);
  console.log("First 3 rows:");
  console.log(JSON.stringify(json.slice(0, 3), null, 2));
}
