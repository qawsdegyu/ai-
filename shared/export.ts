import * as XLSX from "xlsx";

export function toCsv(data: Array<Record<string, string>>) {
  const headers = Object.keys(data[0] ?? { "Router Name": "" });
  return [headers.join(","), ...data.map(row => headers.map(header => `"${String(row[header] ?? "").replaceAll('"', '""')}"`).join(","))].join("\n");
}

export function inventoryToExcelBuffer(data: Array<Record<string, string>>) {
  const sheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Inventory");
  return XLSX.write(workbook, { bookType: "xlsx", type: "array" });
}
