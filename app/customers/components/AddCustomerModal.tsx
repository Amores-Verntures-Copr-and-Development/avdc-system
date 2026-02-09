import Button from "@/components/shared/Button";
import IconButton from "@/components/shared/IconButton";
import Input from "@/components/shared/Input";
import Table from "@/components/shared/Table";
import { CreateCustomerDto } from "@/dtos/customer.dto";
import { UserAuth } from "@/hooks/useSession";
import { downloadExcelTemplate } from "@/utils/downloadExcelTemplateFile";
import { handleChange } from "@/utils/handle-change";
import { importExcel } from "@/utils/importExcel";
import { BookTemplate, Upload } from "lucide-react";
import React, { useRef, useState } from "react";
import toast from "react-hot-toast";

interface AddCustomerModalProps {
  user: UserAuth | null;
  storeId: number;
  onSumit: (data: CreateCustomerDto[]) => Promise<boolean>;
  isSubmitting?: boolean;
  onClose: () => void;
  hasStore: boolean;
}
const AddCustomerModal = ({
  user,
  storeId,
  onSumit,
  onClose,
  isSubmitting,
  hasStore,
}: AddCustomerModalProps) => {
  const [isImport, setIsImport] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [fileName, setFileName] = useState("");
  const [customerForm, setCustomerForm] = useState<CreateCustomerDto>({
    storeId: storeId,
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    customerCreatedBy: 0,
    customerType: "",
  });
  const handleCusChange = handleChange(customerForm, setCustomerForm);

  const handleSubmitAddCustomer = async () => {
    if (!user?.userId) {
      toast.error("No user found!");
      return;
    }
    if (
      !user?.storeId &&
      (user?.empPosition === "staff" || user?.empPosition === "supervisor")
    ) {
      toast.error("No user found!");
      return;
    }
    const cusData: CreateCustomerDto = {
      ...customerForm,
      customerCreatedBy: user?.userId,
      storeId: user?.storeId ?? 0,
    };
    const success = await onSumit([cusData]);
    if (success) {
      onClose();
    }
  };

  const handleImportStoreCustomer = async () => {
    if (!user?.storeId && !user?.userId) {
      throw new Error("No user and store found!");
    }
    const createCustomer: CreateCustomerDto[] =
      importData.map((cus) => ({
        customerEmail: cus.Email ?? "",
        customerName: cus.Name,
        customerPhone: cus.Phone ?? "",
        customerType: cus["Type(staff)"],
        customerCreatedBy: user?.userId,
        storeId: user?.storeId ?? 0,
      })) ?? [];

    const success = await onSumit(createCustomer);
    if (success) {
      onClose();
    }
  };

  const handleDownloadCustomerTemplate = () => {
    const templateHeaders = ["Name", "Phone", "Email", "Type(staff)"];
    downloadExcelTemplate(templateHeaders, "customer_template.xlsx");
  };
  const [importDataColumns, setImportDataColumns] = useState<any[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
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

      // Generate columns from the cleaned keys
      const allKeys = new Set<string>();
      raw.forEach((row) => {
        Object.keys(row).forEach((key) => allKeys.add(key));
      });

      const columns = Array.from(allKeys).map((key) => ({
        key,
        name: key,
        selector: (row: any) => row[key] ?? "",
      }));

      setImportDataColumns(columns);
      setIsImport(true);
    } catch (error) {
      setFileName("");
      console.error("Failed to import Excel:", error);
    }
  };
  const isUserHasStore = user?.storeId && hasStore;
  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex justify-end gap-2 flex-1">
        <IconButton
          onClick={function (): void {
            handleDownloadCustomerTemplate();
          }}
          label={"Download Customer Template"}
          bg={"gray"}
          icon={<BookTemplate className="w-4 h-4 2xl:w-4 2xl:h-4" />}
        />

        <div className="flex">
          <input
            className="text-xs"
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
            <IconButton
              onClick={function (): void {
                triggerFileInput();
              }}
              label={"Import"}
              bg={"green"}
              icon={<Upload className="w-4 h-4 2xl:w-4 2xl:h-4" />}
            />
          </div>
        </div>
      </div>
      {!isImport ? (
        <div className="flex flex-col gap-2 pr-20 pl-20">
          <div className="flex gap-4">
            <Input
              label={"Name"}
              sizes={"xs"}
              onChange={handleCusChange}
              name="customerName"
              value={customerForm.customerName}
            />
            <Input
              label={"Phone"}
              sizes={"xs"}
              onChange={handleCusChange}
              type="number"
              name="customerPhone"
              value={customerForm.customerPhone}
            />
          </div>
          <div className="flex gap-4">
            <Input
              label={"Email"}
              sizes={"xs"}
              type="email"
              onChange={handleCusChange}
              name="customerEmail"
              value={customerForm.customerEmail}
            />
          </div>
          <div className="grid grid-cols-2">
            <Input
              label={"Type (Staff)"}
              sizes={"xs"}
              onChange={handleCusChange}
              name="customerType"
              value={customerForm.customerType}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0  flex flex-col justify-between overflow-hidden">
          <Table
            columns={importDataColumns}
            data={importData}
            maxHeight="h-full"
          />
        </div>
      )}

      {isUserHasStore ? (
        isImport ? (
          <div className="flex mt-auto justify-end gap-3">
            <div>
              <Button
                size="sm"
                label="Cancel"
                color="secondary"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Button
                size="sm"
                label="Import Customer"
                onClick={handleImportStoreCustomer}
                loading={isSubmitting}
              />
            </div>
          </div>
        ) : (
          <div className="flex mt-auto justify-end gap-3">
            <div>
              <Button
                size="sm"
                label="Cancel"
                color="secondary"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Button
                size="sm"
                label="Add Customer"
                onClick={handleSubmitAddCustomer}
                loading={isSubmitting}
              />
            </div>
          </div>
        )
      ) : isImport ? (
        <div className="flex mt-auto justify-end gap-3">
          <div>
            <Button
              size="sm"
              label="Cancel"
              color="secondary"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <Button
              size="sm"
              label="Select Store"
              onClick={handleSubmitAddCustomer}
              loading={isSubmitting}
            />
          </div>
        </div>
      ) : (
        <div className="flex mt-auto justify-end gap-3">
          <div>
            <Button
              size="sm"
              label="Cancel"
              color="secondary"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <Button
              size="sm"
              label="Add Customer"
              onClick={handleSubmitAddCustomer}
              loading={isSubmitting}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AddCustomerModal;
