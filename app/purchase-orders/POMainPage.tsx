import IconButton from "@/components/shared/IconButton";

import PageHeader from "@/components/shared/PageHeader";
import Table, { Column } from "@/components/shared/Table";
import { PurchaseOrders } from "@/types/purchaseOrders";
import { formatDateToWords } from "@/utils/formatDateToWords";
import { getPOStatusInfo } from "@/utils/formatPOStatus";
import { CheckCircle2, ClipboardList, Clock, Eye, Truck } from "lucide-react";
import React, { useMemo } from "react";

const purchaseOrderColumns: Column<PurchaseOrders>[] = [
  {
    name: "PO No",
    key: "poNumber",
    selector: (row) => (
      <span className="text-[10px] font-bold text-primary-1 sm:text-xs">
        {row.poNumber}
      </span>
    ),
  },
  {
    name: "Description",
    key: "poDescription",
    selector: (row) => (
      <span className="block max-w-[220px] truncate text-[10px] text-gray-500 sm:text-xs">
        {row.poDescription || "-"}
      </span>
    ),
  },
  { name: "Created By", key: "poCreatedByName" },
  {
    name: "Created At",
    key: "poCreatedAt",
    selector: (row) => (
      <span className="text-gray-500">
        {formatDateToWords(row.poCreatedAt)}
      </span>
    ),
  },
  {
    name: "Status",
    key: "poStatus",
    selector: (row) => {
      const { status, bgClass, textClass, borderClass, dotClass } =
        getPOStatusInfo(row.poStatus);
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize sm:text-xs ${bgClass} ${textClass} ${borderClass}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
          {status.replace("_", " ")}
        </span>
      );
    },
  },
];

interface StatCardProps {
  title: string;
  value: number;
  caption: string;
  icon: React.ReactNode;
  iconBg: string;
}

const StatCard = ({ title, value, caption, icon, iconBg }: StatCardProps) => (
  <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm 2xl:p-4">
    <div className="flex items-center gap-2">
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl 2xl:h-10 2xl:w-10 ${iconBg}`}
      >
        {icon}
      </div>
      <p className="text-[10px] font-medium text-gray-500 2xl:text-xs">
        {title}
      </p>
    </div>
    <p className="mt-2 text-lg font-bold text-gray-900 2xl:text-2xl">
      {value}
    </p>
    <p className="mt-0.5 text-[10px] text-gray-400 2xl:text-xs">{caption}</p>
  </div>
);

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
  const stats = useMemo(() => {
    const list = data ?? [];
    const pending = list.filter((po) => po.poStatus === "pending").length;
    const inProgress = list.filter((po) =>
      ["approved", "sent", "received"].includes(po.poStatus),
    ).length;
    const completed = list.filter((po) => po.poStatus === "completed").length;

    return { total: list.length, pending, inProgress, completed };
  }, [data]);

  return (
    <>
      <PageHeader title={"Purchase Orders"} subtitle="Manage purchase orders" />

      <div className="my-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          title="Total Purchase Orders"
          value={stats.total}
          caption="All purchase orders"
          icon={
            <ClipboardList className="h-4 w-4 text-primary-1 2xl:h-5 2xl:w-5" />
          }
          iconBg="bg-pink-100"
        />
        <StatCard
          title="Pending"
          value={stats.pending}
          caption="Awaiting approval"
          icon={<Clock className="h-4 w-4 text-gray-500 2xl:h-5 2xl:w-5" />}
          iconBg="bg-gray-100"
        />
        <StatCard
          title="In Progress"
          value={stats.inProgress}
          caption="Approved, sent, or received"
          icon={<Truck className="h-4 w-4 text-indigo-500 2xl:h-5 2xl:w-5" />}
          iconBg="bg-indigo-100"
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          caption="Fully completed"
          icon={
            <CheckCircle2 className="h-4 w-4 text-emerald-600 2xl:h-5 2xl:w-5" />
          }
          iconBg="bg-emerald-100"
        />
      </div>

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
          totalCount={data?.length ?? 0}
          showPagination
          rowSize="h-10"
          textSize="xs"
          showActions
          renderActions={(row) => (
            <div className="flex gap-1 sm:gap-2 px-1 justify-center">
              <IconButton
                onClick={() => {
                  setSelectedPo(row);
                }}
                label={"View"}
                bg={"gray"}
                icon={<Eye className="w-3 h-3 sm:w-4 sm:h-4" />}
              />
            </div>
          )}
        />
      </div>
    </>
  );
};

export default POMainPage;
