export type ImportSourceType = string;

export const requiredImportColumns = (sourceType: ImportSourceType) => {
  if (sourceType === "NewInventory") return [["Versa Router Name", "Router Name"], ["SITE ID", "Site ID"]];
  if (sourceType === "Reference") return [["Host Name", "Router Name"], ["Country"], ["City"]];
  // For any other dynamic source, we still must identify the header row correctly. 
  // Since normalizeImport drops rows without a Router Name, we MUST require it.
  return [["Host Name", "Router Name", "Versa Router Name", "Hostname"]];
};

export const missingImportColumns = (sourceType: ImportSourceType, headers: string[]) => requiredImportColumns(sourceType).filter(group => !group.some(header => headers.includes(header))).map(group => group[0]);
