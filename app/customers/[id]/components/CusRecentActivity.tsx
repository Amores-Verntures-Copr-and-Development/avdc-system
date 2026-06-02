import SalesStatusBadge from "@/app/sales/components/SalesStatusBadge";
import Modal from "@/components/shared/Modal";
import Table, { Column } from "@/components/shared/Table";
import { DisplayCustomerDto } from "@/dtos/customer.dto";
import { DisplaySalesDto } from "@/dtos/sales.dto";
import { ApiResponse } from "@/types/api";
import { SalesStatus } from "@/types/sales";
import { fetcher } from "@/utils/fetcher";
import { formatDateToWords } from "@/utils/formatDateToWords";
import { formatPeso } from "@/utils/formatPeso";
import { CreditCard, RefreshCcwDot, ShoppingCart } from "lucide-react";
import React, { useMemo, useState } from "react";
import useSWR from "swr";
import ShowSelectedSales from "./ShowSelectedSales";

interface CusRecentActivityProps {
  customerId: number;
  storeId: number;
}

const CusRecentActivity = ({ customerId, storeId }: CusRecentActivityProps) => {
  const [tableView, setTableView] = useState<"recent" | "payments" | "refunds">(
    "recent",
  );

  const { data: salesData, isLoading: isLoadingSales } = useSWR<
    ApiResponse<DisplaySalesDto[]>
  >(
    customerId ? `/api/sales/${storeId}/customers/${customerId}` : null,
    fetcher,
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
      <h1 className=" text-sm font-medium">RECENT ACTIVITY</h1>
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
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto mt-5">
        <Table
          maxHeight="h-full"
          columns={columnSales}
          data={salesData?.data ?? []}
          loading={isLoadingSales}
          isRounded={false}
          showPagination={true}
          totalCount={salesData?.count}
          onRowSelection={(row) => setSelectedRow(row)}
        />
      </div>
      <Modal
        isOpen={selectedRow !== null}
        onClose={function (): void {
          setSelectedRow(null);
        }}
        title={`${selectedRow?.salesNo}`}
      >
        <ShowSelectedSales salesData={selectedRow} />
      </Modal>
    </div>
  );
};

export default CusRecentActivity;
