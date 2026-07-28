"use client";

import Button from "@/components/shared/Button";
import Modal from "@/components/shared/Modal";
import PageHeader from "@/components/shared/PageHeader";
import Table, { Column } from "@/components/shared/Table";
import { UserAuth } from "@/hooks/useSession";
import { ApiResponse } from "@/types/api";
import { CreateOrderDto, DisplayOrderDto } from "@/dtos/orders.dto";
import { fetcher } from "@/utils/fetcher";
import { formatDateToWords } from "@/utils/formatDateToWords";
import { formatPeso } from "@/utils/formatPeso";
import { LayoutGrid, TableIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useMemo, useState } from "react";
import toast from "react-hot-toast";
import useSWR from "swr";
import CreateOrderModal from "./component/CreateOrderModal";
import OrderKanbanView from "./component/OrderKanbanView";

interface OrderStorePageProps {
  storeId: number | null;
  user: UserAuth | null;
}

const fulfillmentBadge: Record<string, string> = {
  PICKUP: "bg-blue-100 text-blue-700",
  DELIVERY: "bg-purple-100 text-purple-700",
};

const paymentStatusBadge: Record<string, string> = {
  UNPAID: "bg-red-100 text-red-700",
  PARTIALLY_PAID: "bg-yellow-100 text-yellow-700",
  PAID: "bg-green-100 text-green-700",
  REFUNDED: "bg-gray-200 text-gray-700",
};

const orderStatusBadge: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  PREPARING: "bg-yellow-100 text-yellow-700",
  READY_FOR_PICKUP: "bg-purple-100 text-purple-700",
  OUT_FOR_DELIVERY: "bg-indigo-100 text-indigo-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const Badge = ({ label, className }: { label: string; className: string }) => (
  <span
    className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap ${className}`}
  >
    {label.replaceAll("_", " ")}
  </span>
);

const orderColumns: Column<DisplayOrderDto>[] = [
  { key: "#", name: "#", selector: (_row, index) => index + 1 },
  { key: "orderNumber", name: "Order Number" },
  {
    key: "customerName",
    name: "Customer",
    selector: (row) => row.customerName || "Walk-in",
  },
  {
    key: "fulfillmentType",
    name: "Fulfillment",
    selector: (row) => (
      <Badge
        label={row.fulfillmentType}
        className={fulfillmentBadge[row.fulfillmentType] ?? ""}
      />
    ),
  },
  {
    key: "paymentStatus",
    name: "Payment",
    selector: (row) => (
      <Badge
        label={row.paymentStatus}
        className={paymentStatusBadge[row.paymentStatus] ?? ""}
      />
    ),
  },
  {
    key: "orderStatus",
    name: "Status",
    selector: (row) => (
      <Badge
        label={row.orderStatus}
        className={orderStatusBadge[row.orderStatus] ?? ""}
      />
    ),
  },
  {
    key: "totalAmount",
    name: "Total",
    selector: (row) => formatPeso(row.totalAmount),
  },
  {
    key: "orderCreatedAt",
    name: "Created At",
    selector: (row) => formatDateToWords(row.orderCreatedAt),
  },
];

const OrderStorePage = ({ storeId, user }: OrderStorePageProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showAdd, setShowAdd] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");

  const apiUrl = useMemo(() => {
    if (!storeId || viewMode !== "table") return null;

    const search = searchParams.get("search") || "";
    const limit = searchParams.get("limit") || "";
    const page = searchParams.get("page") || "1";

    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (limit) params.append("limit", limit);
    params.append("page", page);

    return `/api/order/${storeId}?${params.toString()}`;
  }, [storeId, searchParams, viewMode]);

  const {
    data: response = { success: true, message: "", data: [], count: 0 },
    isLoading,
    mutate,
  } = useSWR<ApiResponse<DisplayOrderDto[]>>(apiUrl, fetcher);

  const handleSubmitCreate = async (data: Omit<CreateOrderDto, "storeId">) => {
    if (!storeId) {
      toast.error("No store found!");
      return false;
    }

    try {
      const result = await fetch(`/api/order/${storeId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const res = await result.json();
      if (!res.success) {
        throw new Error(res.message);
      }
      toast.success(res.message);
      mutate();
      setShowAdd(false);
      return true;
    } catch (e: any) {
      toast.error(e.message);
      return false;
    }
  };

  return (
    <>
      <div className="flex justify-between items-center">
        <PageHeader title="Orders" subtitle="View and manage store orders" />
        <div className="flex border border-gray-200 rounded-lg overflow-hidden">
          <Button
            size="sm"
            isRounded={false}
            icon={TableIcon}
            label="Table"
            color={viewMode === "table" ? "primary" : "secondary"}
            onClick={() => setViewMode("table")}
          />
          <Button
            size="sm"
            isRounded={false}
            icon={LayoutGrid}
            label="Kanban"
            color={viewMode === "kanban" ? "primary" : "secondary"}
            onClick={() => setViewMode("kanban")}
          />
        </div>
      </div>

      {viewMode === "table" ? (
        <Table
          columns={orderColumns}
          data={response.data ?? []}
          loading={isLoading}
          totalCount={response.count}
          showPagination
          searchUrl="/orders"
          maxHeight="h-full"
          onRowSelection={(row) => router.push(`/orders/${row.orderId}`)}
        />
      ) : (
        <OrderKanbanView storeId={storeId} />
      )}

      <Modal
        title="Create Order"
        size="xl"
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
      >
        <CreateOrderModal
          storeId={storeId}
          user={user}
          onCancel={() => setShowAdd(false)}
          onSubmit={handleSubmitCreate}
        />
      </Modal>
    </>
  );
};

export default OrderStorePage;
