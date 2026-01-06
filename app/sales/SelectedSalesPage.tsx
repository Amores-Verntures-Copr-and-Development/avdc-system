import Button from "@/components/shared/Button";
import LoaderComponent from "@/components/shared/LoaderComponent";
import PageHeader from "@/components/shared/PageHeader";
import PageLayout from "@/components/shared/PageLayout";
import { DisplaySalesDto, DisplaySalesItems } from "@/dtos/sales.dto";
import { ApiResponse } from "@/types/api";
import { fetcher } from "@/utils/fetcher";
import { formatDateToWords } from "@/utils/formatDateToWords";
import { formatPeso } from "@/utils/formatPeso";
import React from "react";
import useSWR from "swr";

interface SelectedSalesPageProps {
  salesData: DisplaySalesDto | null;
  onBack: () => void;
}
const SelectedSalesPage = ({ salesData, onBack }: SelectedSalesPageProps) => {
  const {
    data: response,
    mutate,
    isLoading,
  } = useSWR<ApiResponse<DisplaySalesItems[]>>(
    salesData?.salesId
      ? `/api/sales/${salesData.storeId}/${salesData.salesId}/sales-items`
      : null,
    fetcher
  );
  if (isLoading) return <LoaderComponent />;
  return (
    <div className="min-h-screen overflow-auto-y">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Sales
        </button>
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-4">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                {salesData?.salesInvoice}
              </h1>
              <p className="text-sm text-gray-500">
                Order #{salesData?.salesNo}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right mr-4">
                <div className="text-xs text-gray-500 mb-1">Total Amount</div>
                <div className="text-2xl font-semibold text-gray-900">
                  {formatPeso(salesData?.salesTotalAmount)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div>
                  <Button label="Print" color="outline" size="sm" />
                </div>
                <div>
                  <Button label="Download PDF" color="outline" size="sm" />
                </div>
                <div>
                  <Button label="Edit" size="sm" hasBorder={false} />
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6 pt-4 border-t border-gray-200">
            <div>
              <div className="text-xs text-gray-500 mb-1">Customer</div>
              <div className="text-sm font-medium text-gray-900">
                {salesData?.customerName || "Walk-in Customer"}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Store</div>
              <div className="text-sm font-medium text-gray-900">
                {salesData?.storeName}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Date</div>
              <div className="text-sm font-medium text-gray-900">
                {formatDateToWords(salesData?.salesCreatedAt ?? "")}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-4">
          <h2 className="font-semibold text-gray-900 mb-4">
            Items ({salesData?.totalItem})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">
                    Description
                  </th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">
                    Price
                  </th>
                  <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">
                    Qty
                  </th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody>
                {response?.data.map((item, index) => {
                  const modifyName = item.prodVarName
                    .toLowerCase()
                    .includes(item.prodName.toLowerCase())
                    ? item.prodVarName
                    : `${item.prodName} ${item.prodVarName}`.trim();
                  return (
                    <tr
                      key={item.salesItemId}
                      className={
                        index !== response?.data.length - 1
                          ? "border-b border-gray-100"
                          : ""
                      }
                    >
                      <td className="py-2">
                        <div className="text-sm font-medium text-gray-900">
                          {modifyName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.prodName}
                        </div>
                      </td>
                      <td className="py-2 text-right text-sm text-gray-700">
                        {formatPeso(item.salesItemPrice)}
                      </td>
                      <td className="py-2 text-center text-sm text-gray-700">
                        {item.salesItemQuantity}
                      </td>
                      <td className="py-2 text-right text-sm font-medium text-gray-900">
                        {formatPeso(item.salesItemSubtotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-end mb-2">
              <div className="text-sm text-gray-600 w-32">Subtotal</div>
              <div className="text-sm text-gray-900 w-24 text-right">
                {formatPeso(salesData?.salesSubTotal)}
              </div>
            </div>
            <div className="flex justify-end mb-3">
              <div className="text-sm text-gray-600 w-32">Tax & Fees</div>
              <div className="text-sm text-gray-900 w-24 text-right">
                {formatPeso(
                  (salesData?.salesTotalAmount ?? 0) -
                    (salesData?.salesSubTotal ?? 0)
                )}
              </div>
            </div>
            <div className="flex justify-end pt-3 border-t border-gray-200">
              <div className="text-base font-semibold text-gray-900 w-32">
                Total
              </div>
              <div className="text-base font-semibold text-gray-900 w-24 text-right">
                {formatPeso(salesData?.salesTotalAmount)}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-4">
          <h2 className="font-semibold text-gray-900 mb-4">Payment Methods</h2>

          <div className="pt-4 mt-4 border-t border-gray-200 space-y-2">
            <div className="flex justify-between items-center">
              <div className="text-sm font-medium text-gray-900">
                Amount Due
              </div>
              <div className="text-base font-semibold text-gray-900">
                {formatPeso(salesData?.salesTotalAmount)}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">Total Paid</div>
              <div className="text-sm text-gray-900">
                {formatPeso(salesData?.salesTotalPaid)}
              </div>
            </div>
            {Number(salesData?.salesTotalPaid) >
              Number(salesData?.salesTotalAmount) && (
              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <div className="text-sm text-gray-600">Change</div>
                <div className="text-sm font-medium text-green-600">
                  {formatPeso(
                    Number(salesData?.salesTotalPaid) -
                      Number(salesData?.salesTotalAmount)
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-200">
            <div className="text-sm font-medium text-gray-900">Total Paid</div>
            <div className="text-base font-semibold text-gray-900">
              {formatPeso(salesData?.salesTotalPaid)}
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            Additional Information
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-500 mb-1">Created By</div>
              <div className="text-sm text-gray-900">
                {salesData?.salesCreatedByName}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Last Updated</div>
              <div className="text-sm text-gray-900">
                {formatDateToWords(salesData?.salesUpdatedAt ?? "")}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectedSalesPage;
