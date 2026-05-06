"use client";

import Button from "@/components/shared/Button";
import IconButton from "@/components/shared/IconButton";
import Input from "@/components/shared/Input";
import Table, { Column } from "@/components/shared/Table";
import { CreateCustomerDto } from "@/dtos/customer.dto";
import { UserAuth } from "@/hooks/useSession";
import { StoreInterface } from "@/types/stores";
import { downloadExcelTemplate } from "@/utils/downloadExcelTemplateFile";
import { handleChange } from "@/utils/handle-change";
import { importExcel } from "@/utils/importExcel";
import { BookTemplate, Upload } from "lucide-react";
import React, { useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

interface AddCustomerModalProps {
  user: UserAuth | null;
  storeId: number;
  onSumit: (data: CreateCustomerDto[]) => Promise<boolean>;
  onSubmitCustomerStores: (
    data: CreateCustomerDto[],
    store: StoreInterface[],
  ) => Promise<boolean>;
  isSubmitting?: boolean;
  onClose: () => void;
  hasStore: boolean;
  stores?: StoreInterface[] | StoreInterface | null;
  storeName: string | null;
}

const PREVIEW_PAGE_SIZE = 100;

const AddCustomerModal = ({
  user,
  storeId,
  onSumit,
  onClose,
  isSubmitting,
  hasStore,
  stores,
  onSubmitCustomerStores,
}: AddCustomerModalProps) => {
  const [isSelectStore, setIsSelectStore] = useState(false);
  const [selectedStores, setSelectedStores] = useState<StoreInterface[]>([]);
  const [isImport, setIsImport] = useState(false);
  const [isImportingFile, setIsImportingFile] = useState(false);

  const [importData, setImportData] = useState<Record<string, any>[]>([]);
  const [importDataKeys, setImportDataKeys] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [previewPage, setPreviewPage] = useState(1);
  console.log({ storeId });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [customerForm, setCustomerForm] = useState<CreateCustomerDto>({
    storeId,
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    customerCreatedBy: 0,
    customerType: "",
  });

  const handleCusChange = handleChange(customerForm, setCustomerForm);

  const storeColumns: Column[] = [
    { key: "#", name: "#", selector: (_row, index) => index + 1 },
    { key: "storeName", name: "Name" },
    { key: "storeLocation", name: "Location" },
  ];

  const isUserHasStore = Boolean((user?.storeId && hasStore) || storeId);

  const totalPreviewPages = Math.ceil(importData.length / PREVIEW_PAGE_SIZE);

  const paginatedPreviewData = importData.slice(
    (previewPage - 1) * PREVIEW_PAGE_SIZE,
    previewPage * PREVIEW_PAGE_SIZE,
  );

  const importDataColumns: Column[] = useMemo(
    () => [
      {
        key: "#",
        name: "#",
        selector: (_row: any, rowIndex: number) =>
          (previewPage - 1) * PREVIEW_PAGE_SIZE + rowIndex + 1,
      },
      ...importDataKeys.map((key) => ({
        key,
        name: key,
        selector: (row: any) => row[key] ?? "",
      })),
    ],
    [importDataKeys, previewPage],
  );

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const resetImport = () => {
    setIsImport(false);
    setIsSelectStore(false);
    setImportData([]);
    setImportDataKeys([]);
    setFileName("");
    setSelectedStores([]);
    setPreviewPage(1);
  };

  const handleSubmitAddCustomer = async () => {
    console.log({ selectedStores });
    if (!customerForm.storeId && selectedStores.length === 0) {
      toast.error("Select store to add customer!");
      return;
    }

    if (!user?.userId) {
      toast.error("No user found!");
      return;
    }

    if (
      !user?.storeId &&
      (user?.empPosition === "staff" || user?.empPosition === "supervisor")
    ) {
      toast.error("No store found!");
      return;
    }

    const cusData: CreateCustomerDto = {
      ...customerForm,
      customerCreatedBy: user.userId,
      storeId: user.storeId || storeId,
    };
    console.log({ cusData });
    if (selectedStores.length > 0) {
      const success = await onSubmitCustomerStores([cusData], selectedStores);
      if (success) {
        onClose();
      }
    } else {
      const success = await onSumit([cusData]);

      if (success) {
        onClose();
      }
    }
  };

  const handleImportStoreCustomer = async () => {
    if (!user?.userId) {
      toast.error("No user found!");
      return;
    }

    if (!user?.storeId) {
      toast.error("No store found!");
      return;
    }

    const createCustomer: CreateCustomerDto[] = importData.map((cus) => ({
      customerEmail: cus.Email ?? "",
      customerName: cus.Name ?? "",
      customerPhone: cus.Phone ?? "",
      customerType: cus["Type(staff)"] ?? "",
      customerCreatedBy: user.userId,
      storeId: user.storeId!,
    }));

    const success = await onSumit(createCustomer);

    if (success) {
      onClose();
    }
  };

  const handleAddCustomerMultipleStores = async () => {
    if (!user?.userId) {
      toast.error("No user found!");
      return;
    }

    if (selectedStores.length === 0) {
      toast.error("Please select at least one store.");
      return;
    }

    const createCustomer: CreateCustomerDto[] = importData.map((cus) => ({
      customerCreatedBy: user.userId,
      customerEmail: cus.Email ?? "",
      customerName: cus.Name ?? "",
      customerPhone: cus.Phone ?? "",
      customerType: cus["Type(staff)"] ?? "",
      storeId: 0,
    }));

    const success = await onSubmitCustomerStores(
      createCustomer,
      selectedStores,
    );

    if (success) {
      onClose();
    }
  };

  const handleDownloadCustomerTemplate = () => {
    const templateHeaders = ["Name", "Phone", "Email", "Type(staff)"];
    downloadExcelTemplate(templateHeaders, "customer_template.xlsx");
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setIsImportingFile(true);
    setFileName(file.name);

    try {
      const raw: Record<string, any>[] = await importExcel(file);

      const cleanRows = raw.filter((row) => {
        const name = String(row.Name ?? "").trim();
        const phone = String(row.Phone ?? "").trim();
        const email = String(row.Email ?? "").trim();
        const type = String(row["Type(staff)"] ?? "").trim();

        return Boolean(name || phone || email || type);
      });

      if (cleanRows.length === 0) {
        toast.error("The imported file is empty.");
        resetImport();
        return;
      }

      const allKeys = new Set<string>();

      cleanRows.forEach((row) => {
        Object.keys(row).forEach((key) => {
          if (key.trim()) {
            allKeys.add(key);
          }
        });
      });

      setImportData(cleanRows);
      setImportDataKeys(Array.from(allKeys));
      setIsImport(true);
      setIsSelectStore(false);
      setPreviewPage(1);

      toast.success(`Imported ${cleanRows.length} customer(s).`);
    } catch (error) {
      console.error("Failed to import Excel:", error);
      toast.error("Failed to import Excel file.");
      resetImport();
    } finally {
      setIsImportingFile(false);
    }
  };

  const handleSelectionChange = (selected: StoreInterface[]) => {
    setSelectedStores(selected);
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex justify-end gap-2">
        <IconButton
          onClick={handleDownloadCustomerTemplate}
          label="Download Customer Template"
          bg="gray"
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
            File: <span className="font-medium">{fileName || "None"}</span>
          </div>

          <IconButton
            onClick={triggerFileInput}
            label={isImportingFile ? "Importing..." : "Import"}
            bg="green"
            icon={<Upload className="w-4 h-4 2xl:w-4 2xl:h-4" />}
          />
        </div>
      </div>

      {isImport && (
        <div className="text-xs text-gray-600">
          Imported {importData.length} row(s). Page {previewPage} of{" "}
          {totalPreviewPages}.
        </div>
      )}

      {isSelectStore && (
        <div className="flex justify-between items-center">
          <h1 className="text-black font-semibold text-sm">
            Select Stores to add customer ({importData.length}).
          </h1>

          {selectedStores.length > 0 && (
            <span className="text-black font-semibold text-xs">
              Added to {selectedStores.length} store(s)
            </span>
          )}
        </div>
      )}

      {!isImport ? (
        !isSelectStore ? (
          <div className="flex flex-col gap-2">
            <div className="flex gap-4">
              <Input
                label="Name"
                sizes="xs"
                onChange={handleCusChange}
                name="customerName"
                value={customerForm.customerName}
              />

              <Input
                label="Phone"
                sizes="xs"
                onChange={handleCusChange}
                type="number"
                name="customerPhone"
                value={customerForm.customerPhone}
              />
            </div>

            <div className="flex gap-4">
              <Input
                label="Email"
                sizes="xs"
                type="email"
                onChange={handleCusChange}
                name="customerEmail"
                value={customerForm.customerEmail}
              />
            </div>

            <div className="grid grid-cols-2">
              <Input
                label="Type (Staff)"
                sizes="xs"
                onChange={handleCusChange}
                name="customerType"
                value={customerForm.customerType}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col justify-between">
            <Table
              showCheckBox
              uniqueIdKey="storeId"
              onSelectionChange={handleSelectionChange}
              columns={storeColumns}
              data={Array.isArray(stores) ? stores : []}
              maxHeight="h-full"
            />
          </div>
        )
      ) : (
        <div className="flex-1 min-h-0 flex flex-col gap-2">
          {!isSelectStore ? (
            <>
              <Table
                columns={importDataColumns}
                data={paginatedPreviewData}
                maxHeight="h-full"
              />
              <div className="flex justify-between items-center text-xs">
                <span>
                  Showing{" "}
                  {importData.length === 0
                    ? 0
                    : (previewPage - 1) * PREVIEW_PAGE_SIZE + 1}
                  -
                  {Math.min(previewPage * PREVIEW_PAGE_SIZE, importData.length)}{" "}
                  of {importData.length}
                </span>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    label="Previous"
                    color="secondary"
                    disabled={previewPage === 1}
                    onClick={() =>
                      setPreviewPage((page) => Math.max(page - 1, 1))
                    }
                  />

                  <Button
                    size="sm"
                    label="Next"
                    color="secondary"
                    disabled={previewPage >= totalPreviewPages}
                    onClick={() =>
                      setPreviewPage((page) =>
                        Math.min(page + 1, totalPreviewPages),
                      )
                    }
                  />
                </div>
              </div>{" "}
            </>
          ) : (
            <div className="flex-1 min-h-0 flex flex-col justify-between">
              <Table
                showCheckBox
                uniqueIdKey="storeId"
                onSelectionChange={handleSelectionChange}
                columns={storeColumns}
                data={Array.isArray(stores) ? stores : []}
                maxHeight="h-full"
              />
            </div>
          )}
        </div>
      )}

      {/* {!isImport ? (
        <div className="flex flex-col gap-2">
          <div className="flex gap-4">
            <Input
              label="Name"
              sizes="xs"
              onChange={handleCusChange}
              name="customerName"
              value={customerForm.customerName}
            />

            <Input
              label="Phone"
              sizes="xs"
              onChange={handleCusChange}
              type="number"
              name="customerPhone"
              value={customerForm.customerPhone}
            />
          </div>

          <div className="flex gap-4">
            <Input
              label="Email"
              sizes="xs"
              type="email"
              onChange={handleCusChange}
              name="customerEmail"
              value={customerForm.customerEmail}
            />
          </div>

          <div className="grid grid-cols-2">
            <Input
              label="Type (Staff)"
              sizes="xs"
              onChange={handleCusChange}
              name="customerType"
              value={customerForm.customerType}
            />
          </div>
        </div>
      ) : isSelectStore ? (
        <div className="flex-1 min-h-0 flex flex-col justify-between">
          <Table
            showCheckBox
            uniqueIdKey="storeId"
            onSelectionChange={handleSelectionChange}
            columns={storeColumns}
            data={Array.isArray(stores) ? stores : []}
            maxHeight="h-full"
          />
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col gap-2">
          <Table
            columns={importDataColumns}
            data={paginatedPreviewData}
            maxHeight="h-full"
          />

          <div className="flex justify-between items-center text-xs">
            <span>
              Showing{" "}
              {importData.length === 0
                ? 0
                : (previewPage - 1) * PREVIEW_PAGE_SIZE + 1}
              -{Math.min(previewPage * PREVIEW_PAGE_SIZE, importData.length)} of{" "}
              {importData.length}
            </span>

            <div className="flex gap-2">
              <Button
                size="sm"
                label="Previous"
                color="secondary"
                disabled={previewPage === 1}
                onClick={() => setPreviewPage((page) => Math.max(page - 1, 1))}
              />

              <Button
                size="sm"
                label="Next"
                color="secondary"
                disabled={previewPage >= totalPreviewPages}
                onClick={() =>
                  setPreviewPage((page) =>
                    Math.min(page + 1, totalPreviewPages),
                  )
                }
              />
            </div>
          </div>
        </div>
      )} */}

      {/* {isUserHasStore ? (
        isImport ? (
          <div className="flex mt-auto justify-end gap-3">
            <Button
              size="sm"
              label="Cancel"
              color="secondary"
              disabled={isSubmitting}
              onClick={onClose}
            />

            <Button
              size="sm"
              label="Import Customer"
              onClick={handleImportStoreCustomer}
              loading={isSubmitting}
              disabled={isImportingFile || importData.length === 0}
            />
          </div>
        ) : (
          <div className="flex mt-auto justify-end gap-3">
            <Button
              size="sm"
              label="Cancel"
              color="secondary"
              disabled={isSubmitting}
              onClick={onClose}
            />

            <Button
              size="sm"
              label="Add Customer"
              onClick={handleSubmitAddCustomer}
              loading={isSubmitting}
            />
          </div>
        )
      ) : isImport ? (
        <div className="flex mt-auto justify-end gap-3">
          <Button
            size="sm"
            label="Cancel"
            color="secondary"
            disabled={isSubmitting}
            onClick={onClose}
          />

          {isSelectStore ? (
            <Button
              size="sm"
              label="Import Customer"
              onClick={handleAddCustomerMultipleStores}
              loading={isSubmitting}
              disabled={
                isImportingFile ||
                importData.length === 0 ||
                selectedStores.length === 0
              }
            />
          ) : (
            <Button
              size="sm"
              label="Select Store"
              onClick={() => setIsSelectStore(true)}
              loading={isSubmitting}
              disabled={isImportingFile || importData.length === 0}
            />
          )}
        </div>
      ) : (
        <div className="flex mt-auto justify-end gap-3">
          <Button
            size="sm"
            label="Cancel"
            color="secondary"
            disabled={isSubmitting}
            onClick={onClose}
          />

          {!isUserHasStore ? (
            <Button
              size="sm"
              label="Select Store"
              onClick={() => setIsSelectStore(true)}
              loading={isSubmitting}
            />
          ) : (
            <Button
              size="sm"
              label="Add Customer"
              onClick={handleSubmitAddCustomer}
              loading={isSubmitting}
            />
          )}
        </div>
      )} */}

      {isUserHasStore ? (
        <div className="flex mt-auto justify-end gap-3">
          <Button
            size="sm"
            label="Cancel"
            color="secondary"
            disabled={isSubmitting}
            onClick={onClose}
          />

          <Button
            size="sm"
            label="Add Customer"
            onClick={handleSubmitAddCustomer}
            loading={isSubmitting}
          />
        </div>
      ) : (
        <div className="flex mt-auto justify-end gap-3">
          <Button
            size="sm"
            label="Cancel"
            color="secondary"
            disabled={isSubmitting}
            onClick={() => {
              if (isSelectStore) {
                setIsSelectStore(false);
              } else {
                onClose();
              }
            }}
          />

          {isSelectStore ? (
            isImport ? (
              <Button
                size="sm"
                label="Import Customer"
                onClick={handleAddCustomerMultipleStores}
                loading={isSubmitting}
                disabled={
                  isImportingFile ||
                  importData.length === 0 ||
                  selectedStores.length === 0
                }
              />
            ) : (
              <Button
                size="sm"
                label="Add Customer"
                onClick={handleSubmitAddCustomer}
                loading={isSubmitting}
              />
            )
          ) : (
            <Button
              size="sm"
              label="Select Store"
              onClick={() => setIsSelectStore(true)}
              loading={isSubmitting}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default AddCustomerModal;
