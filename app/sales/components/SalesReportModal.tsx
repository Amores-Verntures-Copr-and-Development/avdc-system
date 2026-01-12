import Button from "@/components/shared/Button";
import LoaderComponent from "@/components/shared/LoaderComponent";
import Toggle from "@/components/shared/Toggle";
import { DisplaySalesDto } from "@/dtos/sales.dto";
import { useDebounce } from "@/hooks/useDebounce";
import { ApiResponse } from "@/types/api";
import { fetcher } from "@/utils/fetcher";
import { formatDateToWords } from "@/utils/formatDateToWords";
import { formatPeso } from "@/utils/formatPeso";
import React from "react";
import useSWR from "swr";

interface SalesReportModalProps {
  apiUrl: string;
}

const SalesReportModal = ({ apiUrl }: SalesReportModalProps) => {
  const debounceApi = useDebounce(apiUrl, 500);

  const { data: response, isLoading } = useSWR<ApiResponse<DisplaySalesDto[]>>(
    apiUrl ? debounceApi : null,
    fetcher
  );

  if (isLoading) return <LoaderComponent />;

  const salesData = response?.data ?? [];

  // Total amount
  const totalAmount = salesData.reduce(
    (sum, sale) => sum + Number(sale.salesTotalAmount),
    0
  );

  // Store names
  const storesName = Array.from(
    new Set(salesData.map((s) => s.storeName))
  ).join(", ");

  // Payment summary
  const paymentSummary = salesData.reduce<Record<string, number>>(
    (acc, sale) => {
      sale.paymentMethods?.forEach((payment) => {
        const name = payment.payMetName;
        acc[name] = (acc[name] || 0) + Number(payment.salesPaymentAmount);
      });
      return acc;
    },
    {}
  );

  // Date range summary
  const dateSummary = salesData.reduce<{
    from: string | null;
    to: string | null;
  }>(
    (acc, sale) => {
      const saleDate = new Date(sale.salesCreatedAt);
      if (!acc.from || saleDate < new Date(acc.from))
        acc.from = sale.salesCreatedAt;
      if (!acc.to || saleDate > new Date(acc.to)) acc.to = sale.salesCreatedAt;
      return acc;
    },
    { from: null, to: null }
  );

  return (
    <div className="overflow-auto-y p-4">
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Report Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Sales Report
            </h1>
            <div className="flex flex-col gap-2 items-end">
              <div className="flex items-center gap-2">
                <div>
                  <Button label="Print" color="outline" size="sm" />
                </div>
                <div>
                  <Button label="Download PDF" color="outline" size="sm" />
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 mb-1">
                  Total Amount Sales
                </div>
                <div className="text-2xl font-semibold text-gray-900">
                  {formatPeso(totalAmount)}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 pt-4 border-t border-gray-200">
            <div>
              <div className="text-xs text-gray-500 mb-1">From</div>
              <div className="text-sm font-medium text-gray-900">
                {formatDateToWords(dateSummary.from || "")}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">To</div>
              <div className="text-sm font-medium text-gray-900">
                {formatDateToWords(dateSummary.to || "")}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Store(s)</div>
              <div className="text-sm font-medium text-gray-900">
                {storesName}
              </div>
            </div>
          </div>
        </div>

        {/* Sales Table */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            Sales ({salesData.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase pb-3">
                    Sales No
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase pb-3">
                    Customer
                  </th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase pb-3">
                    Subtotal
                  </th>
                  <th className="text-center text-xs font-medium text-gray-500 uppercase pb-3">
                    Total
                  </th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase pb-3">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {salesData.map((sale, idx) => (
                  <tr
                    key={sale.salesId}
                    className={
                      idx !== salesData.length - 1
                        ? "border-b border-gray-100"
                        : ""
                    }
                  >
                    <td className="py-2 text-sm font-medium text-gray-900">
                      {sale.salesNo}
                      <br />
                      <span className="text-xs text-gray-500">
                        {sale.salesInvoice}
                      </span>
                    </td>
                    <td className="py-2 text-sm text-gray-700">
                      {sale.customerName || "Walk-in"}
                    </td>
                    <td className="py-2 text-right text-sm text-gray-700">
                      {formatPeso(sale.salesSubTotal)}
                    </td>
                    <td className="py-2 text-center text-sm text-gray-700">
                      {formatPeso(sale.salesTotalAmount)}
                    </td>
                    <td className="py-2 text-right text-sm font-medium text-gray-900">
                      {formatDateToWords(sale.salesCreatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="mt-6 pt-4 border-t border-gray-200 space-y-3">
            {/* Payment Summary */}
            {paymentSummary && Object.keys(paymentSummary).length > 0 && (
              <div className="flex justify-between mb-3">
                <div className="text-sm text-gray-600 w-32">
                  Payment Summary
                </div>
                <div className="flex flex-col gap-1">
                  {Object.entries(paymentSummary).map(([method, total]) => (
                    <div
                      key={method}
                      className="flex justify-between text-sm text-gray-700 gap-2"
                    >
                      <span>{method}</span>
                      <span className="font-semibold text-green-600">
                        {formatPeso(total)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Total */}
            <div className="flex justify-between pt-3 border-t border-gray-200">
              <div className="text-base font-semibold text-gray-900 w-32">
                Total
              </div>
              <div className="text-base font-semibold text-gray-900 w-24 text-right">
                {formatPeso(totalAmount)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesReportModal;
