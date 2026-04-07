/**
 * Excel-friendly CSV: UTF-8 BOM, comma separator, CRLF lines, RFC-style quoting.
 */

const CSV_SEP = ",";
const LINE_END = "\r\n";

export function escapeCsvCell(
  value: string | number | null | undefined
): string {
  if (value === null || value === undefined) {
    return "";
  }
  const s = typeof value === "number" ? String(value) : String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function rowsToCsv(lines: string[][]): string {
  const body = lines
    .map((row) => row.map(escapeCsvCell).join(CSV_SEP))
    .join(LINE_END);
  return `\uFEFF${body}${LINE_END}`;
}

export function filenameSafeRange(range: string): string {
  return range.replace(/[^a-z0-9_-]/gi, "_");
}

export function filenameWithDate(prefix: string, range: string): string {
  const d = new Date();
  const day = d.toISOString().slice(0, 10);
  return `${prefix}-${filenameSafeRange(range)}-${day}.csv`;
}

/** PDF report name: `diary-report-<range>-<YYYY-MM-DD>.pdf` */
export function pdfReportFilename(range: string): string {
  const d = new Date();
  const day = d.toISOString().slice(0, 10);
  return `diary-report-${filenameSafeRange(range)}-${day}.pdf`;
}
