"use client";

import IconButton from "@/components/shared/IconButton";
import Modal from "@/components/shared/Modal";
import PageHeader from "@/components/shared/PageHeader";
import PageLayout from "@/components/shared/PageLayout";
import Table, { Column } from "@/components/shared/Table";
import { InventoryInterface } from "@/types/inventory";
import { PurchaseOrders } from "@/types/purchaseOrders";
import { fetcher } from "@/utils/fetcher";
import { Eye, FileText, Pencil, Printer, Trash } from "lucide-react";
import React, { useState } from "react";
import useSWR from "swr";
import ShowPOModal from "./components/ShowPOModal";
import { formatDateToWords } from "@/utils/formatDateToWords";

const purchaseOrderColumns: Column<PurchaseOrders>[] = [
  { name: "PO No", key: "poNumber" },
  {
    name: "Create At",
    key: "poCreatedAt",
    selector: (row) => formatDateToWords(row.poCreatedAt),
  },
  { name: "Created By", key: "poCreatedBy" },
  { name: "Status", key: "poStatus" },
];

const PurchaseOrderPage = () => {
  const [showViewPO, setShowViewPO] = useState(false);
  const [selectedPo, setSelecetedPo] = useState<PurchaseOrders>();
  const {
    data: inventoryResponse = { data: [] },
    isLoading,
    mutate: mutateInventory,
  } = useSWR<{ data: PurchaseOrders[] }>("/api/purchase-order/", fetcher);
  return (
    <PageLayout>
      <PageHeader title={"Purchase Orders"} subtitle="Manage purchase orders" />
      <div className="flex-1 min-h-0  flex flex-col justify-between">
        <Table
          columns={purchaseOrderColumns}
          data={inventoryResponse.data}
          maxHeight="h-full"
          totalCount={10}
          rowSize="h-10"
          textSize="xs"
          showActions
          renderActions={(row) => (
            <div className="flex gap-2 justify-center">
              {/* View Button */}
              <IconButton
                onClick={() => {
                  setShowViewPO(true);
                  setSelecetedPo(row);
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
        <Modal
          size="xl"
          hasPadding={false}
          modalDetails={
            <div className="flex justify-between items-center w-full ">
              <div className="flex flex-col">
                <span className="text-black text-sm">
                  Date:{" "}
                  {formatDateToWords(selectedPo?.poCreatedAt ?? "", {
                    showMinute: false,
                    showHour: false,
                  })}
                </span>
                <span className="text-black text-sm">
                  Requisition:{" "}
                  {selectedPo?.purchaseOrderRequest
                    ?.map((req) => req.requestNo)
                    .join(", ")}
                </span>
              </div>

              <div className="text-right">
                <span className="text-black text-sm">
                  Status: {selectedPo?.poStatus}
                </span>
              </div>
            </div>
          }
          title={`${selectedPo?.poNumber}`}
          isOpen={showViewPO}
          onClose={function (): void {
            setShowViewPO(false);
          }}
          children={<ShowPOModal data={selectedPo ?? null} />}
        />
      </div>
    </PageLayout>
  );
};

export default PurchaseOrderPage;
