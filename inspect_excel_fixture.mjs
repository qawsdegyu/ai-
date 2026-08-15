import * as XLSX from "xlsx";
import { readFile } from "node:fs/promises";
const workbook = XLSX.read(await readFile("/home/ubuntu/upload/NewInventory.xlsx"), { type: "buffer" });
console.log(workbook.SheetNames);
for (const name of workbook.SheetNames) {
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[name], { defval: "", header: 1 });
  console.log(name, rows.slice(0, 2));
}
