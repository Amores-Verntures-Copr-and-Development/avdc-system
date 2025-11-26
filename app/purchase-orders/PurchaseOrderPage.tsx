"use client";

import IconButton from "@/components/shared/IconButton";
import Modal from "@/components/shared/Modal";
import PageHeader from "@/components/shared/PageHeader";
import PageLayout from "@/components/shared/PageLayout";
import Table, { Column } from "@/components/shared/Table";
import { PurchaseOrders } from "@/types/purchaseOrders";
import { fetcher } from "@/utils/fetcher";
import { Eye, FileText, Printer } from "lucide-react";
import React, { useState } from "react";
import useSWR from "swr";
import ShowPOModal from "./components/ShowPOModal";
import { formatDateToWords } from "@/utils/formatDateToWords";
import { getPOStatusInfo } from "@/utils/formatPOStatus";
import { useSession } from "@/hooks/useSession";

const purchaseOrderColumns: Column<PurchaseOrders>[] = [
  {
    name: "PO No",
    key: "poNumber",
    selector: (row) => (
      <span className="text-[10px] sm:text-xs font-semibold">
        {row.poNumber}
      </span>
    ),
  },

  { name: "Created By", key: "poCreatedByName" },
  {
    name: "Create At",
    key: "poCreatedAt",
    selector: (row) => formatDateToWords(row.poCreatedAt),
  },
  {
    name: "Status",
    key: "poStatus",
    selector: (row) => {
      const { status, bgClass, textClass, borderClass } = getPOStatusInfo(
        row.poStatus
      );
      return (
        <span
          className={`${bgClass} ${textClass} ${borderClass} text-[10px] sm:text-xs rounded px-1 py-1 text-center font-semibold`}
        >
          {status}
        </span>
      );
    },
  },
];

const PurchaseOrderPage = () => {
  const [showViewPO, setShowViewPO] = useState(false);
  const [selectedPo, setSelecetedPo] = useState<PurchaseOrders>();
  const { user } = useSession();
  const baseApi =
    user?.userRole === "employee" && user?.empPosition === "purchaser"
      ? `/api/purchase-order/userId/${user?.userId}`
      : `/api/purchase-order/`;
  const {
    data: inventoryResponse = { data: [] },
    mutate: mutateInventory,
    isLoading,
  } = useSWR<{ data: PurchaseOrders[] }>(user ? baseApi : null, fetcher);
  const handleUpdateData = async () => {
    const updatedData = await mutateInventory();
    // The updatedData should contain the fresh data
    const findSelectedPo = updatedData?.data.find(
      (po) => po.poId === selectedPo?.poId
    );
    if (findSelectedPo) {
      console.log("Selected PO: ", findSelectedPo);
      setSelecetedPo(findSelectedPo);
    }
  };
  return (
    <PageLayout className="p-2 gap-2">
      <PageHeader title={"Purchase Orders"} subtitle="Manage purchase orders" />
      <div className="flex-1 min-h-0  flex flex-col justify-between">
        <Table
          searchUrl="/purchase-orders"
          showCheckBox
          columns={purchaseOrderColumns}
          data={inventoryResponse.data}
          onRowSelection={(row) => {
            setShowViewPO(true);
            setSelecetedPo(row);
          }}
          loading={isLoading}
          maxHeight="h-full"
          totalCount={10}
          rowSize="h-10"
          textSize="xs"
          showActions
          renderActions={(row) => (
            <div className="flex gap-1 sm:gap-2 px-1 justify-center">
              {/* View Button */}
              <IconButton
                onClick={() => {
                  setShowViewPO(true);
                  setSelecetedPo(row);
                }}
                label={"View"}
                bg={"gray"}
                icon={<Eye className="w-3 h-3 sm:w-4 sm:h-4" />}
              />
              <IconButton
                onClick={() => {}}
                label={"Print"}
                bg={"green"}
                icon={<Printer className=" w-3 h-3  sm:w-4 sm:h-4" />}
              />
              <IconButton
                onClick={() => {}}
                label={"Convert to PO"}
                bg={"blue"}
                icon={<FileText className=" w-3 h-3  sm:w-4 sm:h-4" />}
              />
            </div>
          )}
        />
        <Modal
          size="xl"
          hasPadding={false}
          className="h-[90%]"
          modalDetails={renderModalDetails(selectedPo)}
          // getPOStatusInfo(selectedPo?.poStatus)
          title={`${selectedPo?.poNumber}`}
          isOpen={showViewPO}
          onClose={function (): void {
            setShowViewPO(false);
          }}
        >
          <ShowPOModal
            user={user}
            data={selectedPo ?? null}
            mutate={handleUpdateData}
            onClose={() => {
              setShowViewPO(false);
            }}
          />
        </Modal>
      </div>
    </PageLayout>
  );
};

export default PurchaseOrderPage;

const renderModalDetails = (selectedPo?: PurchaseOrders) => {
  const { status, bgClass, textClass } = getPOStatusInfo(
    selectedPo?.poStatus ?? "pending"
  ); // you can define variables here
  return (
    <div className="flex justify-between items-center w-full">
      <div className="flex flex-col">
        <span className="text-black text-[10px] 2xl:text-sm">
          Date:{" "}
          {formatDateToWords(selectedPo?.poCreatedAt ?? "", {
            showMinute: false,
            showHour: false,
          })}
        </span>
        <span className="text-black text-[10px] 2xl:text-sm">
          Requisition:{" "}
          {selectedPo?.purchaseOrderRequest
            ?.map((req) => req.requestNo)
            .join(", ")}
        </span>
      </div>

      <div className="text-right flex items-center gap-2">
        <span className="text-[10px] xl:text-sm"> Status: </span>
        <div className={`${bgClass}  rounded-2xl px-2 `}>
          {" "}
          <span className={`${textClass} text-[10px] xl:text-xs font-semibold`}>
            {status}
          </span>
        </div>
      </div>
    </div>
  );
};
