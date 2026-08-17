export type ReportDateRange = { from?: string; to?: string };

export function toReportDateRange(from: string, to: string) {
  const fromDate = from ? new Date(`${from}T00:00:00`).toISOString() : undefined;
  const toDate = to ? new Date(`${to}T23:59:59.999`).toISOString() : undefined;
  return { from: fromDate, to: toDate } satisfies ReportDateRange;
}

export function isValidReportDateRange(from: string, to: string) {
  if (!from || !to) return true;
  return from <= to;
}
