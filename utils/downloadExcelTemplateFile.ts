import * as XLSX from "xlsx";

export const downloadExcelTemplate = (
  headers: string[],
  filename: string = "template.xlsx",
) => {
  // Create template data with headers and one empty row
  const emptyRow: Record<string, string> = {};
  headers.forEach((header) => {
    emptyRow[header] = "";
  });

  const templateData = [emptyRow];

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(templateData);

  // Set dynamic column widths based on header length
  const colWidths = headers.map((header) => ({
    wch: Math.max(header.length + 2, 10), // Minimum width of 10, plus some padding
  }));
  ws["!cols"] = colWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, "Template");

  // Generate file and trigger download
  XLSX.writeFile(wb, filename);
};
