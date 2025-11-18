import * as XLSX from "xlsx";

export const importExcel = async (
  file: File
): Promise<Record<string, any>[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const result = e.target?.result;
        if (!result) {
          return resolve([]);
        }

        const data = new Uint8Array(result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const rawJson = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);

        const parsed = rawJson.map((row) => {
          const newRow: Record<string, any> = {};
          for (const key in row) {
            const value = row[key];
            if (typeof value === "number" && value > 30000 && value < 60000) {
              // Likely Excel serial date
              const jsDate = XLSX.SSF.parse_date_code(value);
              if (jsDate) {
                newRow[key] = `${jsDate.m}/${jsDate.d}/${jsDate.y}`; // Format: M/D/YYYY
              } else {
                newRow[key] = value;
              }
            } else {
              newRow[key] = value;
            }
          }
          return newRow;
        });

        resolve(parsed);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(reader.error);
    };

    reader.readAsArrayBuffer(file);
  });
};
