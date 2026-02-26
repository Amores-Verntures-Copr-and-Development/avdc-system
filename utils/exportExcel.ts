import * as XLSX from "xlsx";

type ExportExcelOptions<T> = {
  data: T[]; // Array of objects to export
  fileName: string; // Name of the downloaded file
  sheetName?: string; // Optional sheet name (default: "Sheet1")
  headers?: string[]; // Optional custom column headers
};

/**
 * Reusable Excel export function
 */
export function exportToExcel<T>({
  data,
  fileName,
  sheetName = "Sheet1",
  headers,
}: ExportExcelOptions<T>) {
  if (!data || data.length === 0) {
    console.warn("No data to export!");
    return;
  }

  // Convert JSON to worksheet
  const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });

  // Optional: Add friendly headers at the top if provided
  if (headers) {
    XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: "A1" });
  }

  // Create a new workbook and append worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Trigger download
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}
