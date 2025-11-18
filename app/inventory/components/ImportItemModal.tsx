import Button from "@/components/shared/Button";
import Table from "@/components/shared/Table";
import { ImportItemDto } from "@/dtos/items.dto";
import { importExcel } from "@/utils/importExcel";
import { Import } from "lucide-react";
import React, { useRef, useState } from "react";
import toast from "react-hot-toast";

interface ImportItemModalProps {
  onSubmit: (row: ImportItemDto[]) => Promise<boolean>;
  loading: boolean;
  onClose: () => void;
}

const ImportItemModal = ({
  onSubmit,
  loading,
  onClose,
}: ImportItemModalProps) => {
  const [importData, setImportData] = useState<any[]>([]);
  const [importDataColumns, setImportDataColumns] = useState<any[]>([]);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    event.target.value = "";
    setFileName(file.name);
    try {
      const raw: Record<string, any>[] = await importExcel(file);

      // Normalize keys in each row

      // Optional: Filter if you want to skip blank rows
      // const filtered = parsed.filter((row) => row["Customer Name"]);

      setImportData(raw);
      console.log({ raw });
      // Generate columns from the cleaned keys
      const allKeys = new Set<string>();
      raw.forEach((row) => {
        Object.keys(row).forEach((key) => allKeys.add(key));
      });

      const columns = Array.from(allKeys).map((key) => ({
        key,
        name: key,
        selector: (row: any) => row[key] ?? "-",
      }));
      console.log({ columns });
      setImportDataColumns(columns);
    } catch (error) {
      setFileName("");
      console.error("Failed to import Excel:", error);
    }
  };

  const handleSubmit = async () => {
    if (!importData || importData.length === 0) {
      toast.error("No items to be imported!");
      return;
    }
    const success = await onSubmit(importData);
    if (success) {
      onClose();
    }
  };
  return (
    <div className="flex flex-col gap-2 h-full overflow-hidden">
      <div className="flex justify-end">
        <input
          type="file"
          accept=".xlsx, .xls"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: "none" }}
        />

        <div className="text-xs text-gray-600 bg-gray-100 px-3 py-1 rounded">
          File: <span className="font-medium">{fileName}</span>
        </div>
        <div>
          <Button
            icon={<Import className="w-3 h-3 sm:w-4 sm:h-4" />}
            label="Import Item"
            onClick={triggerFileInput}
            size="xs"
          />
        </div>
      </div>
      <div className="flex-1 min-h-0  flex flex-col justify-between overflow-hidden">
        <Table
          columns={importDataColumns}
          data={importData}
          maxHeight="h-full"
        />
      </div>

      <div className="flex justify-end gap-2 mt-auto">
        <div>
          <Button size="xs" label="cancel" color="nocolor" disabled={loading} />
        </div>
        <div>
          <Button
            size="xs"
            label="Import"
            onClick={handleSubmit}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default ImportItemModal;
