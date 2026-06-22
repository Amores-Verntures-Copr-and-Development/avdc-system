import Button from "@/components/shared/Button";
import LoaderComponent from "@/components/shared/LoaderComponent";
import Toggle from "@/components/shared/Toggle";
import { DisplaySalesDto } from "@/dtos/sales.dto";
import { useDebounce } from "@/hooks/useDebounce";
import { ApiResponse } from "@/types/api";
import { exportToExcel } from "@/utils/exportExcel";
import { fetcher } from "@/utils/fetcher";
import { formatDateToWords } from "@/utils/formatDateToWords";
import { formatPeso } from "@/utils/formatPeso";
import { Download, FileText, Printer } from "lucide-react";
import React, { useState } from "react";
import useSWR from "swr";

interface SalesReportModalProps {
  apiUrl: string;
  showReportType: "Customer" | "Sales" | null;
}

const SalesReportModal = ({
  apiUrl,
  showReportType,
}: SalesReportModalProps) => {
  const parsedUrl = new URL(apiUrl, window.location.origin);
  const from = parsedUrl.searchParams.get("from") || "";
  const to = parsedUrl.searchParams.get("to") || "";

  const [includeSaleItems, setIncludeSaleItems] = useState(true);

  const debounceApi = useDebounce(
    includeSaleItems
      ? `${apiUrl}&includeSaleItems=true${
          showReportType === "Customer" ? `&customer=true` : ""
        }`
      : `${apiUrl}${showReportType === "Customer" ? `&customer=true` : ""}`,
    500,
  );

  const { data: response, isLoading } = useSWR<ApiResponse<DisplaySalesDto[]>>(
    apiUrl ? debounceApi : null,
    fetcher,
  );

  if (isLoading) return <LoaderComponent />;

  const salesData = response?.data ?? [];

  const formatDiscount = (discount: any) => {
    if (!discount) return "-";

    const value =
      discount.discountType === "percent"
        ? `${discount.discountValue}%`
        : formatPeso(Number(discount.discountValue));

    return `${discount.discountName} (${value}) - ${formatPeso(
      Number(discount.discountAmount || 0),
    )}`;
  };

  const getSaleRefundAmount = (sale: DisplaySalesDto) => {
    return (
      sale.salesRefunds?.reduce(
        (sum: number, refund: any) => sum + Number(refund.salesRefAmount || 0),
        0,
      ) ?? 0
    );
  };

  const getSaleNetTotal = (sale: DisplaySalesDto) => {
    return Number(sale.salesTotalAmount || 0) - getSaleRefundAmount(sale);
  };

  const getTotalDiscountAmount = (sale: DisplaySalesDto) => {
    const wholeOrderDiscountTotal =
      sale.salesDiscounts?.reduce(
        (sum: number, discount: any) =>
          sum + Number(discount.discountAmount || 0),
        0,
      ) ?? 0;

    const singleItemDiscountTotal =
      sale.saleItems?.reduce((sum: number, item: any) => {
        const itemTotal =
          item.salesItemDiscounts?.reduce(
            (subSum: number, discount: any) =>
              subSum + Number(discount.discountAmount || 0),
            0,
          ) ?? 0;

        return sum + itemTotal;
      }, 0) ?? 0;

    return wholeOrderDiscountTotal + singleItemDiscountTotal;
  };

  const grossTotalAmount = salesData.reduce(
    (sum, sale) => sum + Number(sale.salesTotalAmount || 0),
    0,
  );

  const totalRefundAmount = salesData.reduce(
    (sum, sale) => sum + getSaleRefundAmount(sale),
    0,
  );

  const netTotalAmount = grossTotalAmount - totalRefundAmount;

  const totalDiscountAmount = salesData.reduce(
    (sum, sale) => sum + getTotalDiscountAmount(sale),
    0,
  );

  const storesName = Array.from(
    new Set(salesData.map((sale) => sale.storeName)),
  ).join(", ");

  const uniqueStores = new Set(salesData.map((sale) => sale.storeName));
  const paymentSummary = salesData.reduce<Record<string, number>>(
    (acc, sale) => {
      const refundAmount = getSaleRefundAmount(sale);
      const saleTotal = Number(sale.salesTotalAmount || 0);

      sale.paymentMethods?.forEach((payment) => {
        const name = payment.payMetName;
        const paymentAmount = Number(payment.salesPaymentAmount || 0);

        const refundShare =
          saleTotal > 0 ? (paymentAmount / saleTotal) * refundAmount : 0;

        acc[name] = (acc[name] || 0) + (paymentAmount - refundShare);
      });

      return acc;
    },
    {},
  );

  const dateSummary = salesData.reduce<{
    from: string | null;
    to: string | null;
  }>(
    (acc, sale) => {
      const saleDate = new Date(sale.salesCreatedAt);

      if (!acc.from || saleDate < new Date(acc.from)) {
        acc.from = sale.salesCreatedAt;
      }

      if (!acc.to || saleDate > new Date(acc.to)) {
        acc.to = sale.salesCreatedAt;
      }

      return acc;
    },
    { from: null, to: null },
  );

  const handleExportData = () => {
    const formatData = salesData.map((sales) => ({
      Date: sales.salesCreatedAt,
      SalesNo: sales.salesNo,
      Invoice: sales.salesInvoice,
      Store: sales.storeName,
      Customer: sales.customerName || "Walk-in",
      Cashier: sales.salesCreatedByName,
      Subtotal: Number(sales.salesSubTotal),

      WholeOrderDiscounts:
        sales.salesDiscounts
          ?.map((discount: any) => formatDiscount(discount))
          .join(", ") ?? "-",

      SingleItemDiscounts:
        sales.saleItems
          ?.flatMap(
            (item: any) =>
              item.salesItemDiscounts?.map(
                (discount: any) =>
                  `${item.salesItemQuantity} x ${
                    item.saleItemName
                  }: ${formatDiscount(discount)}`,
              ) ?? [],
          )
          .join(", ") ?? "-",

      TotalDiscount: getTotalDiscountAmount(sales),

      Refunds:
        sales.salesRefunds
          ?.map((refund: any) => formatPeso(Number(refund.salesRefAmount || 0)))
          .join(", ") ?? "-",

      TotalRefund: getSaleRefundAmount(sales),
      GrossTotal: Number(sales.salesTotalAmount),
      NetTotal: getSaleNetTotal(sales),

      Payment:
        sales.paymentMethods
          ?.map(
            (payment) =>
              `${payment.payMetName} (${formatPeso(
                Number(payment.salesPaymentAmount),
              )})`,
          )
          .join(", ") ?? "-",

      Items:
        sales.saleItems
          ?.map(
            (item: any) =>
              `${item.salesItemQuantity} x ${item.saleItemName} - ${formatPeso(
                Number(item.salesItemTotal),
              )}`,
          )
          .join(", ") ?? "-",
    }));

    exportToExcel({
      data: formatData,
      fileName: "SalesReport",
      sheetName: "Sales Report",
    });
  };

  return (
    <div className="min-h-0 overflow-y-auto p-4">
      <div className="mx-auto max-w-7xl space-y-4">
        <Toggle
          initial={includeSaleItems}
          label="Show sale items"
          sizes="xs"
          onToggle={(state) => setIncludeSaleItems(state)}
        />

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Sales Report
              </h1>

              <p className="mt-1 text-sm text-gray-400">
                Shows discounts, refunds, and net sales total.
              </p>
            </div>

            <div className="flex flex-col items-end gap-3">
              <div className="flex items-center gap-2">
                <Button
                  label="Print"
                  color="outline"
                  size="sm"
                  icon={Printer}
                />

                <Button
                  label="Download PDF"
                  color="outline"
                  size="sm"
                  icon={FileText}
                />

                <Button
                  icon={Download}
                  label="Export"
                  color="outline"
                  size="sm"
                  onClick={handleExportData}
                />
              </div>

              <div className="text-right">
                <p className="text-xs text-gray-400">Net Sales</p>

                <p className="text-2xl font-bold text-gray-900">
                  {formatPeso(netTotalAmount)}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 border-t border-gray-100 pt-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-gray-400">From</p>

              <p className="text-sm font-medium text-gray-900">
                {formatDateToWords(from || dateSummary.from || "")}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-400">To</p>

              <p className="text-sm font-medium text-gray-900">
                {formatDateToWords(to || dateSummary.to || "")}
              </p>
            </div>

            {uniqueStores.size === 1 && (
              <div>
                <p className="text-xs text-gray-400">Store</p>

                <p className="text-sm font-medium text-gray-900">
                  {storesName}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">
                Sales ({salesData.length})
              </h2>

              <p className="text-xs text-gray-400">
                Refunds are deducted from each sale total.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1620px] table-fixed">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="w-[140px] pb-3 text-left text-xs font-medium uppercase text-gray-400">
                    Sales No
                  </th>

                  <th className="w-[100px] pb-3 text-left text-xs font-medium uppercase text-gray-400">
                    Customer
                  </th>

                  <th className="w-[140px] pb-3 text-left text-xs font-medium uppercase text-gray-400">
                    Store
                  </th>

                  <th className="w-[100px] pb-3 text-left text-xs font-medium uppercase text-gray-400">
                    Cashier
                  </th>

                  {includeSaleItems && (
                    <th className="w-[220px] pb-3 text-left text-xs font-medium uppercase text-gray-400">
                      Items
                    </th>
                  )}

                  <th className="w-[120px] pb-3 text-right text-xs font-medium uppercase text-gray-400">
                    Subtotal
                  </th>

                  <th className="w-[140px] pb-3 text-center text-xs font-medium uppercase text-rose-400">
                    Refunds
                  </th>

                  <th className="w-[260px] pb-3 text-left text-xs font-medium uppercase text-gray-400">
                    Whole Order Discounts
                  </th>

                  <th className="w-[320px] pb-3 text-left text-xs font-medium uppercase text-gray-400">
                    Single Item Discounts
                  </th>

                  <th className="w-[120px] pb-3 text-right text-xs font-medium uppercase text-gray-400">
                    Net Total
                  </th>

                  <th className="w-[160px] pb-3 text-right text-xs font-medium uppercase text-gray-400">
                    Method
                  </th>

                  <th className="w-[140px] pb-3 text-right text-xs font-medium uppercase text-gray-400">
                    Date
                  </th>
                </tr>
              </thead>

              <tbody>
                {salesData.map((sale, idx) => {
                  const saleRefundAmount = getSaleRefundAmount(sale);
                  const saleNetTotal = getSaleNetTotal(sale);

                  return (
                    <tr
                      key={sale.salesId}
                      className={
                        idx !== salesData.length - 1
                          ? "border-b border-gray-100"
                          : ""
                      }
                    >
                      <td className="py-4 pr-4 align-top text-sm font-semibold text-gray-900">
                        {sale.salesNo}

                        <br />

                        <div className="flex flex-col">
                          {" "}
                          <span className="text-xs font-normal text-gray-400">
                            {sale.salesInvoice}
                          </span>
                          <span className="text-[11px] font-normal text-gray-400">
                            {formatDateToWords(sale.salesCreatedAt, {
                              showHour: true,
                              showMinute: true,
                            })}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 pr-4 align-top text-xs text-gray-700">
                        {sale.customerName || "Walk-in"}
                      </td>

                      <td className="py-4 pr-4 align-top text-xs font-medium text-gray-700">
                        {sale.storeName}
                      </td>

                      <td className="py-4 pr-4 align-top text-xs font-medium text-gray-700">
                        {sale.salesCreatedByName}
                      </td>

                      {includeSaleItems && (
                        <td className="py-4 pr-4 align-top text-xs text-gray-700">
                          {sale.saleItems?.length ? (
                            <div className="space-y-1">
                              {sale.saleItems.map((item: any) => (
                                <div
                                  key={item.salesItemId}
                                  className="leading-5"
                                >
                                  {item.salesItemQuantity} x {item.saleItemName}
                                </div>
                              ))}
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                      )}

                      <td className="py-4 pr-4 align-top text-right text-xs text-gray-700 whitespace-nowrap">
                        {formatPeso(Number(sale.salesSubTotal))}
                      </td>

                      <td className="py-4 pr-4 align-top text-center text-xs whitespace-nowrap">
                        {saleRefundAmount > 0 ? (
                          <span className="font-semibold text-rose-500">
                            -{formatPeso(saleRefundAmount)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>

                      <td className="py-4 pr-4 align-top text-xs text-gray-700">
                        {sale.salesDiscounts?.length ? (
                          <div className="space-y-2">
                            {sale.salesDiscounts.map(
                              (discount: any, index: number) => (
                                <div
                                  key={`${sale.salesId}-discount-${index}`}
                                  className="rounded-lg bg-rose-50 px-3 py-2 text-rose-700"
                                >
                                  {formatDiscount(discount)}
                                </div>
                              ),
                            )}
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>

                      <td className="py-4 pr-4 align-top text-xs text-gray-700">
                        {sale.saleItems?.some(
                          (item: any) => item.salesItemDiscounts?.length,
                        ) ? (
                          <div className="space-y-2">
                            {sale.saleItems.flatMap(
                              (item: any) =>
                                item.salesItemDiscounts?.map(
                                  (discount: any, index: number) => (
                                    <div
                                      key={`${item.salesItemId}-${index}`}
                                      className="rounded-lg bg-amber-50 px-3 py-2 text-amber-700"
                                    >
                                      <div className="font-semibold">
                                        {item.salesItemQuantity} x{" "}
                                        {item.saleItemName}
                                      </div>

                                      <div className="mt-1">
                                        {formatDiscount(discount)}
                                      </div>
                                    </div>
                                  ),
                                ) ?? [],
                            )}
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>

                      <td className="py-4 pr-4 align-top text-right text-xs font-semibold text-gray-900 whitespace-nowrap">
                        {formatPeso(saleNetTotal)}
                      </td>

                      <td className="py-4 pr-4 align-top text-right text-xs text-gray-700">
                        {sale.paymentMethods?.length ? (
                          <div className="space-y-1">
                            {sale.paymentMethods.map((payment) => (
                              <div
                                key={payment.salesPaymentId}
                                className="whitespace-nowrap"
                              >
                                {payment.payMetName}{" "}
                                {formatPeso(Number(payment.salesPaymentAmount))}
                              </div>
                            ))}
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>

                      <td className="py-4 align-top text-right text-xs font-medium text-gray-900">
                        {formatDateToWords(sale.salesCreatedAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-6 space-y-3 border-t border-gray-100 pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Gross Sales</span>

              <span className="font-semibold text-gray-900">
                {formatPeso(grossTotalAmount)}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Refunds</span>

              <span className="font-semibold text-rose-500">
                -{formatPeso(totalRefundAmount)}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Discounts</span>

              <span className="font-semibold text-rose-500">
                -{formatPeso(totalDiscountAmount)}
              </span>
            </div>

            {Object.keys(paymentSummary).length > 0 && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Payment Summary</span>

                <div className="flex flex-col gap-1">
                  {Object.entries(paymentSummary).map(([method, total]) => (
                    <div
                      key={method}
                      className="flex justify-between gap-6 text-sm text-gray-700"
                    >
                      <span>{method}</span>

                      <span className="font-semibold text-emerald-600">
                        {formatPeso(total)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between border-t border-gray-100 pt-3">
              <span className="text-base font-semibold text-gray-900">
                Net Total
              </span>

              <span className="text-base font-bold text-gray-900">
                {formatPeso(netTotalAmount)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesReportModal;
