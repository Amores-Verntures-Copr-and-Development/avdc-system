"use client";

import Button from "@/components/shared/Button";
import IconButton from "@/components/shared/IconButton";
import Modal from "@/components/shared/Modal";
import PageHeader from "@/components/shared/PageHeader";
import Table, { Column, TableHandle } from "@/components/shared/Table";
import { DisplayRequestOrderDto } from "@/dtos/request.dto";
import { useSession } from "@/hooks/useSession";
import { fetcher } from "@/utils/fetcher";
import { Eye, FileText, Printer } from "lucide-react";
import React, { useState, useRef } from "react";
import useSWR from "swr";
import CreatePOModal from "./components/CreatePOModal";
import { CreatePurchaseOrderFormDto } from "@/dtos/purchase.dto";
import toast from "react-hot-toast";
import { formatDateToWords } from "@/utils/formatDateToWords";
import PageLayout from "@/components/shared/PageLayout";

import ViewRequestModal from "./ViewRequestModal";
import { getRequestStatusOption } from "@/utils/requestOrderUtils";

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
  {
    name: "Status",
    key: "requestStatus",
    selector: (row) => {
      const { label, bg, color, border } = getRequestStatusOption(
        row.requestStatus,
      );
      return (
        <span
          className={`${bg} ${color} ${border} text-xs rounded px-1 py-1 text-center font-semibold`}
        >
          {label}
        </span>
      );
    },
  },
];

const AdminRequisitionPage = () => {
  const tableRef = useRef<TableHandle>(null);
  const [isShowRequest, setIsShowRequest] = useState(false);
  const handleClear = () => {
    tableRef.current?.clearSelection();
  };
  const { user } = useSession();
  const [showCreatePO, setShowCreatePO] = useState(false);
  const [selectedtedRows, setSelectedRows] =
    useState<DisplayRequestOrderDto[]>();
  const [selectedtedRow, setSelectedRow] =
    useState<DisplayRequestOrderDto | null>();

  const { data: itemResponse = { data: [] }, mutate } = useSWR<{
    data: DisplayRequestOrderDto[];
  }>(user ? `/api/requests/request-orders/` : null, fetcher);
  // const { data: itemResponse = { data: [] }, mutate } = useSWR<{
  //   data: DisplayRequestOrderDto[];
  // }>(user ? `/api/requests/stock-room/userId/${user?.userId}` : null, fetcher);

  const handleSelectionChange = (selected: DisplayRequestOrderDto[]) => {
    setSelectedRows(selected);
  };
  const handleCreatePurchaseOrder = async (
    data: CreatePurchaseOrderFormDto,
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
      console.log(e);
      toast.error("Failed to add Inventory.");
      return false;
    }
  };
  return (
    <PageLayout className="p-2 gap-2">
      <PageHeader
        title={"Requisition"}
        subtitle="Manage request orders from stores."
      />

      <div className="flex-1 min-h-0  flex flex-col">
        {(itemResponse.data && itemResponse.data.length > 0) ||
        user?.empPosition !== "purchaser" ? (
          <Table<DisplayRequestOrderDto>
            columns={requisitionColumns}
            ref={tableRef}
            data={itemResponse.data}
            totalCount={10}
            onRowSelection={(row) => {
              setSelectedRow(row);
              setIsShowRequest(true);
            }}
            showActions
            showCheckBox
            maxHeight="h-full"
            uniqueIdKey="requestId"
            onSelectionChange={handleSelectionChange}
            renderTopActions={
              selectedtedRows &&
              selectedtedRows.length > 0 && (
                <div className="flex gap-4">
                  <div>
                    {" "}
                    <Button
                      icon={FileText}
                      label="View Request"
                      onClick={() => {
                        // setShowCreatePO(true);
                      }}
                      size="xs"
                      color="secondary"
                    />
                  </div>
                  {selectedtedRows.every(
                    (ro) => ro.requestStatus === "pending",
                  ) && (
                    <div>
                      <Button
                        icon={FileText}
                        label="Convert to PO"
                        onClick={() => {
                          setShowCreatePO(true);
                        }}
                        size="xs"
                      />
                    </div>
                  )}
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
                    setIsShowRequest(true);
                    console.log(selectedtedRow);
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
        ) : (
          <div className="flex flex-1 justify-center items-center">
            <span>
              To view store requests, please ask admin first to assign stores to
              your stock room.
            </span>
          </div>
        )}
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
        size="xl"
      >
        <CreatePOModal
          data={selectedtedRows ?? []}
          user={user}
          onCancel={() => {
            setShowCreatePO(false);
          }}
          onSubmit={handleCreatePurchaseOrder}
        />
      </Modal>
      <Modal
        hasPadding={false}
        className="bg-white h-[95%] p-2"
        title={`Request Order (${selectedtedRow?.requestNo})`}
        modalDetails={(() => {
          const { label, bg, color, border } = getRequestStatusOption(
            selectedtedRow?.requestStatus || "",
          );
          return (
            <div className="flex flex-1 justify-between align-middle items-center">
              <div className="flex flex-col">
                <span className="text-xs text-gray-600">
                  Store:{" "}
                  <span className="font-bold text-black">
                    {selectedtedRow?.storeName}
                  </span>
                </span>
                <span className="text-xs text-gray-600">
                  Requestor:{" "}
                  <span className="font-bold text-black">
                    {selectedtedRow?.requestedByName}
                  </span>
                </span>
              </div>
              <span className="text-xs text-gray-600">
                Status:{" "}
                <span
                  className={`${bg} ${color} ${border} text-xs rounded px-1 py-1 text-center font-semibold`}
                >
                  {label}
                </span>
              </span>
            </div>
          );
        })()}
        size="xl"
        isOpen={isShowRequest}
        onClose={() => {
          setIsShowRequest(false);
        }}
      >
        <ViewRequestModal
          selectedReq={selectedtedRow || null}
          mutateRequest={mutate}
          user={user}
        />
      </Modal>
    </PageLayout>
  );
};

export default AdminRequisitionPage;
