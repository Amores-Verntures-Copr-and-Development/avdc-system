import SalesStatusBadge from "@/app/sales/components/SalesStatusBadge";
import Modal from "@/components/shared/Modal";
import Table, { Column } from "@/components/shared/Table";
import { DisplayCustomerDto } from "@/dtos/customer.dto";
import { DisplayOrderDto } from "@/dtos/orders.dto";
import { DisplaySalesDto } from "@/dtos/sales.dto";
import { ApiResponse } from "@/types/api";
import { SalesStatus } from "@/types/sales";
import { fetcher } from "@/utils/fetcher";
import { formatDateToWords } from "@/utils/formatDateToWords";
import { formatPeso } from "@/utils/formatPeso";
import {
  CreditCard,
  ListOrdered,
  RefreshCcwDot,
  ShoppingCart,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";
import useSWR from "swr";
import ShowSelectedSales from "./ShowSelectedSales";

interface CusRecentActivityProps {
  customerId: number;
  storeId: number;
}

const orderStatusBadge: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  PREPARING: "bg-yellow-100 text-yellow-700",
  READY_FOR_PICKUP: "bg-purple-100 text-purple-700",
  OUT_FOR_DELIVERY: "bg-indigo-100 text-indigo-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const CusRecentActivity = ({ customerId, storeId }: CusRecentActivityProps) => {
  const router = useRouter();
  const [tableView, setTableView] = useState<
    "recent" | "payments" | "refunds" | "orders"
  >("recent");
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: "",
    to: "",
  });

  const salesUrl = useMemo(() => {
    if (!customerId) return null;

    const params = new URLSearchParams();
    if (dateRange.from) params.set("from", dateRange.from);
    if (dateRange.to) params.set("to", dateRange.to);

    const query = params.toString();
    return `/api/sales/${storeId}/customers/${customerId}${query ? `?${query}` : ""}`;
  }, [customerId, storeId, dateRange]);

  const { data: salesData, isLoading: isLoadingSales } = useSWR<
    ApiResponse<DisplaySalesDto[]>
  >(salesUrl, fetcher);

  // Nets out refunds the same way the "Total Amount" column below does,
  // so this reflects actual net spend for whatever date range is selected
  // - not the sale's original gross amount.
  const totalSpentInRange = useMemo(() => {
    return (salesData?.data ?? []).reduce((sum, row) => {
      const totalRefunds = Array.isArray(row.salesRefunds)
        ? row.salesRefunds.reduce(
            (total, sr) => total + Number(sr.salesRefAmount),
            0,
          )
        : 0;

      return sum + (Number(row.salesTotalAmount) - totalRefunds);
    }, 0);
  }, [salesData?.data]);

  const { data: ordersData, isLoading: isLoadingOrders } = useSWR<
    ApiResponse<DisplayOrderDto[]>
  >(
    tableView === "orders" && customerId
      ? `/api/customers/${customerId}/orders`
      : null,
    fetcher,
  );

  const orderColumns = useMemo<Column<DisplayOrderDto>[]>(
    () => [
      { key: "#", name: "#", selector: (_row, index) => index + 1 },
      {
        key: "orderNumber",
        name: "Order Number",
        selector: (row) => (
          <span className="font-semibold">{row.orderNumber}</span>
        ),
      },
      {
        key: "fulfillmentType",
        name: "Fulfillment",
      },
      {
        key: "totalAmount",
        name: "Total",
        selector: (row) => (
          <span className="font-semibold">{formatPeso(row.totalAmount)}</span>
        ),
      },
      {
        key: "orderStatus",
        name: "Status",
        selector: (row) => (
          <span
            className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              orderStatusBadge[row.orderStatus] ?? ""
            }`}
          >
            {row.orderStatus.replaceAll("_", " ")}
          </span>
        ),
      },
      {
        key: "orderCreatedAt",
        name: "Date",
        selector: (row) => formatDateToWords(row.orderCreatedAt ?? ""),
      },
    ],
    [],
  );

  const [openDiscountId, setOpenDiscountId] = useState<number | null>(null);
  const [selectedRow, setSelectedRow] = useState<DisplaySalesDto | null>(null);
  const columnSales = useMemo<Column<DisplaySalesDto>[]>(() => {
    return [
      {
        key: "#",
        name: "#",
        selector: (_row, index) => index + 1,
      },
      {
        key: "salesNo",
        name: "Sales No",
        selector: (row) => <span className="font-semibold">{row.salesNo}</span>,
      },

      {
        key: "salesSubTotal ",
        name: "Subtotal",
        selector: (row) => (
          <span className="text-[11px] ">{formatPeso(row.salesSubTotal)}</span>
        ),
      },

      {
        key: "salesTotalAmount",
        name: "Total Amount",
        selector: (row) => {
          const totalRefunds = Array.isArray(row.salesRefunds)
            ? row.salesRefunds.reduce(
                (total, sr) => total + Number(sr.salesRefAmount),
                0,
              )
            : 0;

          return (
            <span className="font-semibold">
              {formatPeso(Number(row.salesTotalAmount) - totalRefunds)}
            </span>
          );
        },
      },
      { key: "totalItem", name: "Total Item" },
      {
        key: "method",
        name: "Payment Method",
        selector: (row) => {
          const paymentMethod = row.paymentMethods || [];
          return (
            <div className="relative min-w-[100px]">
              <select
                className="border border-gray-300 rounded px-1 py-0.5 xl:px-2 xl:py-1 w-full text-[10px] xl:text-xs bg-gray-50 appearance-none cursor-default"
                disabled
              >
                <option value="">
                  {/* {paymentMethod.filter((s) => s !== null).length > 0
                ? `No Payment Method (${
                    paymentMethod.filter((s) => s !== null).length
                  })`
                : "No Payment Method"} */}
                  {paymentMethod.length > 1
                    ? `Multiple Payments (${
                        paymentMethod.filter((s) => s !== null).length
                      })`
                    : paymentMethod.length === 1
                      ? `${paymentMethod[0].payMetName} (${formatPeso(
                          Number(paymentMethod[0].salesPaymentAmount) >
                            Number(row.salesTotalAmount)
                            ? row.salesTotalAmount
                            : paymentMethod[0].salesPaymentAmount,
                        )})`
                      : `No payment`}
                </option>
              </select>
              {paymentMethod.filter((s) => s !== null).length > 0 && (
                <div className="absolute hidden group-hover:block z-10 top-full left-0 right-0 bg-white border border-gray-300 rounded shadow-lg max-h-32 overflow-y-auto">
                  {paymentMethod
                    .filter((method) => method !== null)
                    .map((method, index) => (
                      <div
                        key={index}
                        className="px-2 py-1 text-[10px] xl:text-xs hover:bg-gray-100 cursor-default"
                      >
                        {`${method.payMetName} (${formatPeso(
                          Number(method.salesPaymentAmount) >
                            Number(row.salesTotalAmount)
                            ? row.salesTotalAmount
                            : method.salesPaymentAmount,
                        )})`}
                      </div>
                    ))}
                </div>
              )}
            </div>
          );
        },
      },

      {
        key: "salesCreatedAt",
        name: "Date",
        selector: (row) => formatDateToWords(row.salesCreatedAt ?? ""),
      },
      {
        key: "salesStatus",
        name: "Status",
        selector: (row) => (
          <SalesStatusBadge status={row.salesStatus as SalesStatus} />
        ),
      },
    ];
  }, [salesData?.data]);
  return (
    <div className="flex-[8] border-border border rounded bg-white shadow p-2 h-full min-h-0 flex flex-col">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-sm font-medium">RECENT ACTIVITY</h1>

        {tableView !== "orders" && (
          <div className="text-right">
            <p className="text-sm font-semibold text-primary-1">
              {totalSpentInRange !== 0 ? formatPeso(totalSpentInRange) : "-"}
            </p>
            <p className="text-[10px] text-gray-500">
              Total Spent{dateRange.from && dateRange.to ? " (selected range)" : ""}
            </p>
          </div>
        )}
      </div>
      <div className="flex gap-2 mt-5 shrink-0">
        <button
          onClick={() => setTableView("recent")}
          className={`flex gap-1 items-center ${tableView === "recent" ? `border-b-2 border-primary-1` : ""} p-2`}
        >
          <ShoppingCart className="h-4 w-5 text-gray-500 " />
          <span className="text-xs font-medium text-gray-500">
            Recent Sales
          </span>
        </button>
        <button
          onClick={() => setTableView("payments")}
          className={`flex gap-1 items-center ${tableView === "payments" ? `border-b-2 border-primary-1` : ""} p-2`}
        >
          <CreditCard className="h-4 w-5 text-gray-500 " />
          <span className="text-xs font-medium text-gray-500">Payments</span>
        </button>
        <button
          onClick={() => setTableView("refunds")}
          className={`flex gap-1 items-center ${tableView === "refunds" ? `border-b-2 border-primary-1` : ""} p-2`}
        >
          <RefreshCcwDot className="h-4 w-5 text-gray-500 " />
          <span className="text-xs font-medium text-gray-500">Refunds</span>
        </button>
        <button
          onClick={() => setTableView("orders")}
          className={`flex gap-1 items-center ${tableView === "orders" ? `border-b-2 border-primary-1` : ""} p-2`}
        >
          <ListOrdered className="h-4 w-5 text-gray-500 " />
          <span className="text-xs font-medium text-gray-500">Orders</span>
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto mt-5">
        {tableView === "orders" ? (
          <Table
            maxHeight="h-full"
            columns={orderColumns}
            data={ordersData?.data ?? []}
            loading={isLoadingOrders}
            isRounded={false}
            showPagination={true}
            totalCount={ordersData?.count}
            onRowSelection={(row) => router.push(`/orders/${row.orderId}`)}
          />
        ) : (
          <Table
            maxHeight="h-full"
            columns={columnSales}
            data={salesData?.data ?? []}
            loading={isLoadingSales}
            isRounded={false}
            showPagination={true}
            totalCount={salesData?.count}
            onRowSelection={(row) => setSelectedRow(row)}
            showDateRange
            onDateRangeChange={setDateRange}
          />
        )}
      </div>
      <Modal
        isOpen={selectedRow !== null}
        onClose={function (): void {
          setSelectedRow(null);
        }}
        title={`${selectedRow?.salesNo}`}
        size="xl"
      >
        <ShowSelectedSales salesData={selectedRow} />
      </Modal>
    </div>
  );
};

export default CusRecentActivity;
