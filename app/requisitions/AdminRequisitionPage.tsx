"use client";

import Button from "@/components/shared/Button";
import IconButton from "@/components/shared/IconButton";
import Modal from "@/components/shared/Modal";
import PageHeader from "@/components/shared/PageHeader";
import Table, { Column, TableHandle } from "@/components/shared/Table";
import { DisplayRequestOrderDto } from "@/dtos/request.dto";
import { useSession } from "@/hooks/useSession";
import { fetcher } from "@/utils/fetcher";
import { Eye, FileText, Pencil, Plus, Printer, Trash } from "lucide-react";
import React, { useState, useRef } from "react";
import useSWR from "swr";
import CreatePOModal from "./components/CreatePOModal";
import { CreatePurchaseOrderFormDto } from "@/dtos/purchase.dto";
import toast from "react-hot-toast";
import { formatDateToWords } from "@/utils/formatDateToWords";
import PageLayout from "@/components/shared/PageLayout";

const requisitionColumns: Column<DisplayRequestOrderDto>[] = [
  { name: "Order ID", key: "requestNo" },
  { name: "Total Items", key: "totalItems" },
  { name: "Requested By", key: "requestedByName" },
  {
    name: "Date Created",
    key: "requestCreatedAt",
    selector: (row) => formatDateToWords(row.requestCreatedAt),
  },
  {
    name: "Date Updated",
    key: "requestUpdatedAt",
    selector: (row) => formatDateToWords(row.requestUpdatedAt),
  },
  { name: "Store", key: "storeName" },
  { name: "Status", key: "requestStatus" },
];

const AdminRequisitionPage = () => {
  const tableRef = useRef<TableHandle>(null);
  const handleClear = () => {
    tableRef.current?.clearSelection();
    console.log("Clear Data:");
  };
  const { user } = useSession();
  const [showCreatePO, setShowCreatePO] = useState(false);
  const [selectedtedRows, setSelectedRows] =
    useState<DisplayRequestOrderDto[]>();
  const [selectedtedRow, setSelectedRow] = useState<DisplayRequestOrderDto>();
  const {
    data: itemResponse = { data: [] },
    isLoading: loading,
    mutate,
  } = useSWR<{ data: DisplayRequestOrderDto[] }>(
    user ? `/api/requests/request-orders/` : null,
    fetcher
  );

  const handleSelectionChange = (selected: DisplayRequestOrderDto[]) => {
    setSelectedRows(selected);
  };
  const handleCreatePurchaseOrder = async (
    data: CreatePurchaseOrderFormDto
  ) => {
    try {
      const result = await fetch(`api/purchase-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const res = await result.json();
      if (!res.success) {
        console.log("Res: ", res);
        throw new Error(res.err);
      }
      toast.success("PO created successfully!");
      mutate();
      handleClear();
      setShowCreatePO(false);
      return true;
    } catch (e) {
      toast.error("Failed to add Inventory.");
      return false;
    }
  };
  return (
    <PageLayout className="p-4 gap-2">
      <PageHeader
        title={"Requisition"}
        subtitle="Manage request orders from stores."
      />

      <div className="flex-1 min-h-0  flex flex-col">
        <Table<DisplayRequestOrderDto>
          columns={requisitionColumns}
          ref={tableRef}
          data={itemResponse.data}
          totalCount={10}
          showActions
          showCheckBox
          maxHeight="h-full"
          onSelectionChange={handleSelectionChange}
          renderTopActions={
            selectedtedRows &&
            selectedtedRows.length > 0 && (
              <div className="">
                <Button
                  icon={<FileText size={18} />}
                  label="Convert to PO"
                  onClick={() => {
                    setShowCreatePO(true);
                  }}
                  size="sm"
                />
              </div>
            )
          }
          searchUrl="/requisitions"
          renderActions={(row) => (
            <div className="flex gap-2 justify-center">
              {/* View Button */}
              <IconButton
                onClick={() => {
                  setSelectedRow(row);
                }}
                label={"View"}
                bg={"gray"}
                icon={<Eye size={18} />}
              />
              <IconButton
                onClick={() => {}}
                label={"Print"}
                bg={"green"}
                icon={<Printer size={18} />}
              />
              <IconButton
                onClick={() => {}}
                label={"Convert to PO"}
                bg={"blue"}
                icon={<FileText size={18} />}
              />
            </div>
          )}
        />
      </div>
      <Modal
        className="bg-white h-[80%]"
        title="Create Purchase Order"
        hasPadding={false}
        isOpen={showCreatePO}
        modalDetails={
          <span className="text-xs font-semibold">
            From Requests:{" "}
            {selectedtedRows?.map((req) => req.requestNo).join(",")}
          </span>
        }
        onClose={function (): void {
          setShowCreatePO(false);
        }}
        children={
          <CreatePOModal
            data={selectedtedRows ?? []}
            user={user}
            onCancel={() => {
              setShowCreatePO(false);
            }}
            onSubmit={handleCreatePurchaseOrder}
          />
        }
        size="xl"
      />
    </PageLayout>
  );
};

export default AdminRequisitionPage;
