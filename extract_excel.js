const xlsx = require('xlsx');

const filePath = 'c:/Users/User/Downloads/imcan-inventory-hub-complete/imcan-inventory-hub/IMCAN-Reference-Sheet---2024 (1).xlsm';
const workbook = xlsx.readFile(filePath, { sheetRows: 50 }); // Read first 50 rows of each sheet

const output = [];

workbook.SheetNames.forEach(sheetName => {
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet, { defval: "" });
  output.push(`--- Sheet: ${sheetName} ---`);
  if (data.length > 0) {
    const keys = Object.keys(data[0]).slice(0, 5); // Take first 5 columns
    output.push(`Columns: ${keys.join(', ')}`);
    // Pick 2 random rows (or first 2)
    const sample = data.slice(1, 3);
    sample.forEach((row, i) => {
      output.push(`Row ${i + 1}: ${JSON.stringify(row)}`);
    });
  } else {
    output.push("No data found or empty sheet.");
  }
  output.push("");
});

require('fs').writeFileSync('c:/Users/User/Downloads/imcan-inventory-hub-complete/imcan-inventory-hub/excel_summary.txt', output.join('\n'));
