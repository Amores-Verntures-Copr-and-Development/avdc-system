import IconButton from "@/components/shared/IconButton";

import PageHeader from "@/components/shared/PageHeader";
import Table, { Column } from "@/components/shared/Table";
import { PurchaseOrders } from "@/types/purchaseOrders";
import { formatDateToWords } from "@/utils/formatDateToWords";
import { getPOStatusInfo } from "@/utils/formatPOStatus";
import { Eye, Printer, FileText } from "lucide-react";
import React from "react";

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
    name: "Created At",
    key: "poCreatedAt",
    selector: (row) => formatDateToWords(row.poCreatedAt),
  },
  {
    name: "Status",
    key: "poStatus",
    selector: (row) => {
      const { status, bgClass, textClass, borderClass } = getPOStatusInfo(
        row.poStatus,
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

interface POMainPageProps {
  data: PurchaseOrders[] | null;
  setSelectedPo: React.Dispatch<React.SetStateAction<PurchaseOrders | null>>;
  loading?: boolean;
}
const POMainPage = ({
  data,
  setSelectedPo,
  loading: isLoading,
}: POMainPageProps) => {
  return (
    <>
      <PageHeader title={"Purchase Orders"} subtitle="Manage purchase orders" />
      <div className="flex-1 min-h-0  flex flex-col justify-between">
        <Table
          searchUrl="/purchase-orders"
          showCheckBox
          uniqueIdKey="poId"
          columns={purchaseOrderColumns}
          data={data ?? []}
          onRowSelection={(row) => {
            setSelectedPo(row);
          }}
          loading={isLoading}
          maxHeight="h-full"
          totalCount={10}
          showPagination
          rowSize="h-10"
          textSize="xs"
          showActions
          renderActions={(row) => (
            <div className="flex gap-1 sm:gap-2 px-1 justify-center">
              {/* View Button */}
              <IconButton
                onClick={() => {
                  setSelectedPo(row);
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
        {/* <Modal
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
        </Modal> */}
      </div>
    </>
  );
};

export default POMainPage;
