import { formatDiscountValue } from "@/app/pos/components/sidebar/DiscountList";
import { DisplaySalesDto, DisplaySalesItems } from "@/dtos/sales.dto";
import { ApiResponse } from "@/types/api";
import { fetcher } from "@/utils/fetcher";
import { formatDateToWords } from "@/utils/formatDateToWords";
import { formatPeso } from "@/utils/formatPeso";
import { getSalesStatusOption } from "@/utils/salesUtils";
import React from "react";
import useSWR from "swr";

interface ShowSelectedSalesProps {
  salesData: DisplaySalesDto | null;
}

const ShowSelectedSales = ({ salesData }: ShowSelectedSalesProps) => {
  const { data: response } = useSWR<ApiResponse<DisplaySalesItems[]>>(
    salesData?.salesId
      ? `/api/sales/${salesData.storeId}/${salesData.salesId}/sales-items`
      : null,
    fetcher,
  );

  const refundTotal =
    Array.isArray(salesData?.salesRefunds) && salesData.salesRefunds.length > 0
      ? salesData.salesRefunds.reduce(
          (total, s) => Number(total) + Number(s.salesRefAmount),
          0,
        )
      : 0;

  const finalTotal =
    Number(salesData?.salesTotalAmount ?? 0) - Number(refundTotal);

  const { label, bg, color, border } = getSalesStatusOption(
    salesData?.salesStatus ?? "",
  );

  const getItemName = (item: DisplaySalesItems) => {
    return (item.prodVarName ?? "")
      .toLowerCase()
      .includes((item.prodName ?? "").toLowerCase())
      ? item.prodVarName
      : `${item.prodName ?? ""} ${item.prodVarName ?? ""}`.trim();
  };

  const getRefundQty = (item: DisplaySalesItems) => {
    if (!item.salesItemsRefunds || item.salesItemsRefunds.length === 0) {
      return "-";
    }

    return item.salesItemsRefunds.reduce(
      (count, i) => i.salesRefItemQty + count,
      0,
    );
  };

  const getDiscountText = (item: DisplaySalesItems) => {
    if (!item.salesItemDiscounts || item.salesItemDiscounts.length === 0) {
      return "-";
    }

    return item.salesItemDiscounts.map((dis) => {
      const discount =
        dis.discountType === "percent"
          ? `${formatDiscountValue(dis.discountValue)}%`
          : formatPeso(dis.discountValue);

      return `${discount} (${formatPeso(dis.discountAmount)})`;
    });
  };

  return (
    <div className="space-y-4 p-1">
      {/* Header */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="grid gap-5 md:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Order #{salesData?.salesNo}
            </p>

            <div className="mt-4">
              <p className="text-xs text-gray-500">Total Amount</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatPeso(finalTotal)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Info
              label="Customer"
              value={salesData?.customerName || "Walk-in Customer"}
            />
            <Info label="Store" value={salesData?.storeName || "-"} />
            <Info
              label="Date"
              value={formatDateToWords(salesData?.salesCreatedAt ?? "", {
                showHour: true,
                showMinute: true,
              })}
            />
            <div>
              <p className="mb-1 text-xs text-gray-500">Status</p>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${bg} ${color} ${border}`}
              >
                {label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">
          Items ({salesData?.totalItem})
        </h2>

        {/* Mobile Item Cards */}
        <div className="space-y-3 md:hidden">
          {response?.data.map((item) => (
            <div
              key={item.salesItemId}
              className="rounded-lg border border-gray-200 bg-gray-50 p-3"
            >
              <div className="mb-3">
                <p className="text-sm font-semibold text-gray-900">
                  {getItemName(item)}
                </p>
                <p className="text-xs text-gray-500">{item.prodName}</p>
              </div>

              <div className="space-y-2 text-xs">
                <DetailRow
                  label="Price"
                  value={formatPeso(item.salesItemPrice)}
                />
                <DetailRow
                  label="Qty"
                  value={Number(item.salesItemQuantity).toFixed(0)}
                />
                <DetailRow
                  label="Refund Qty"
                  value={getRefundQty(item)}
                  danger
                />
                <DetailRow
                  label="Subtotal"
                  value={formatPeso(item.salesItemSubtotal)}
                />
                <DetailRow label="Discount" value={getDiscountText(item)} />
                <DetailRow
                  label="Total"
                  value={formatPeso(item.salesItemTotal)}
                  strong
                />
                <DetailRow
                  label="Status"
                  value={item.salesItemStatus === "active" ? "Completed" : "-"}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <TableHead align="left">Description</TableHead>
                <TableHead>Price</TableHead>
                <TableHead align="center">Qty</TableHead>
                <TableHead align="center" danger>
                  Refund Qty
                </TableHead>
                <TableHead>Subtotal</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
              </tr>
            </thead>

            <tbody>
              {response?.data.map((item, index) => (
                <tr
                  key={item.salesItemId}
                  className={
                    index !== response.data.length - 1
                      ? "border-b border-gray-100"
                      : ""
                  }
                >
                  <td className="py-3 pr-3">
                    <p className="text-xs font-semibold text-gray-900">
                      {getItemName(item)}
                    </p>
                    <p className="text-xs text-gray-500">{item.prodName}</p>
                  </td>
                  <TableCell>{formatPeso(item.salesItemPrice)}</TableCell>
                  <TableCell align="center">
                    {Number(item.salesItemQuantity).toFixed(0)}
                  </TableCell>
                  <TableCell align="center">{getRefundQty(item)}</TableCell>
                  <TableCell>{formatPeso(item.salesItemSubtotal)}</TableCell>
                  <TableCell>{getDiscountText(item)}</TableCell>
                  <TableCell strong>
                    {formatPeso(item.salesItemTotal)}
                  </TableCell>
                  <TableCell>
                    {item.salesItemStatus === "active" ? "Completed" : "-"}
                  </TableCell>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Order Summary */}
        <div className="mt-5 space-y-3 border-t border-gray-200 pt-4">
          <SummaryRow
            label="Subtotal"
            value={formatPeso(salesData?.salesSubTotal ?? 0)}
          />

          {Boolean(refundTotal && refundTotal !== 0) && (
            <SummaryRow
              label="Refund"
              value={`- ${formatPeso(refundTotal)}`}
              danger
            />
          )}

          {salesData?.salesDiscounts?.map((disc) => (
            <SummaryRow
              key={disc.salesDiscountId}
              label={`${disc.discountName} ${
                disc.discountType === "percent"
                  ? `(${disc.discountValue}%)`
                  : `(${formatPeso(disc.discountValue)})`
              }`}
              value={`- ${formatPeso(disc.discountAmount)}`}
              danger
            />
          ))}

          <div className="border-t border-gray-200 pt-3">
            <SummaryRow label="Total" value={formatPeso(finalTotal)} strong />
          </div>
        </div>
      </div>

      {/* Payment Summary */}
      <div className="rounded-xl border border-green-200 bg-green-50 p-4">
        <h2 className="mb-4 text-sm font-semibold text-green-800">
          Payment Summary
        </h2>

        <div className="rounded-lg border border-green-100 bg-white p-3">
          <div className="grid gap-4 sm:grid-cols-3">
            <Info
              label="Amount Due"
              value={formatPeso(salesData?.salesTotalAmount ?? 0)}
            />
            <Info label="Total Paid" value={formatPeso(finalTotal)} />
            <Info
              label="Refunded"
              value={refundTotal ? `- ${formatPeso(refundTotal)}` : "-"}
              danger={refundTotal > 0}
            />
          </div>
        </div>

        {salesData?.paymentMethods && salesData.paymentMethods.length > 0 && (
          <div className="mt-4 space-y-2">
            {salesData.paymentMethods.map((pay) => {
              const refundedForMethod =
                salesData.salesPaymentRefunds
                  ?.filter((r) => r.payMetId === pay.payMetId)
                  .reduce((sum, r) => sum + Number(r.salesPayRefAmount), 0) ??
                0;

              const netPayment =
                Number(pay.salesPaymentAmount) - refundedForMethod;

              return (
                <div
                  key={pay.salesPaymentId}
                  className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {pay.payMetName ?? "Unknown"}
                    </p>
                    {pay.paymentReference && (
                      <p className="text-xs text-gray-500">
                        Ref: {pay.paymentReference}
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatPeso(netPayment)}
                    </p>
                    {refundedForMethod > 0 && (
                      <p className="text-xs text-red-600">
                        - {formatPeso(refundedForMethod)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Additional Info */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">
          Additional Information
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <Info
            label="Created By"
            value={salesData?.salesCreatedByName || "-"}
          />
          <Info
            label="Last Updated"
            value={formatDateToWords(salesData?.salesUpdatedAt ?? "")}
          />
        </div>
      </div>
    </div>
  );
};

const Info = ({
  label,
  value,
  danger,
}: {
  label: string;
  value: React.ReactNode;
  danger?: boolean;
}) => (
  <div>
    <p className="mb-1 text-xs text-gray-500">{label}</p>
    <p
      className={`text-sm font-medium ${
        danger ? "text-red-600" : "text-gray-900"
      }`}
    >
      {value}
    </p>
  </div>
);

const DetailRow = ({
  label,
  value,
  strong,
  danger,
}: {
  label: string;
  value: React.ReactNode;
  strong?: boolean;
  danger?: boolean;
}) => (
  <div className="flex justify-between gap-3">
    <span className={danger ? "text-red-500" : "text-gray-500"}>{label}</span>
    <span
      className={`text-right ${
        strong ? "font-semibold text-gray-900" : "text-gray-800"
      } ${danger ? "text-red-600" : ""}`}
    >
      {value}
    </span>
  </div>
);

const SummaryRow = ({
  label,
  value,
  strong,
  danger,
}: {
  label: string;
  value: React.ReactNode;
  strong?: boolean;
  danger?: boolean;
}) => (
  <div className="flex justify-between gap-4 text-sm">
    <span className={strong ? "font-semibold text-gray-900" : "text-gray-600"}>
      {label}
    </span>
    <span
      className={`text-right ${
        strong ? "text-base font-bold text-gray-900" : "font-medium"
      } ${danger ? "text-red-600" : "text-gray-900"}`}
    >
      {value}
    </span>
  </div>
);

const TableHead = ({
  children,
  align = "right",
  danger,
}: {
  children: React.ReactNode;
  align?: "left" | "right" | "center";
  danger?: boolean;
}) => (
  <th
    className={`pb-3 text-${align} text-[10px] font-semibold uppercase tracking-wider ${
      danger ? "text-red-500" : "text-gray-500"
    }`}
  >
    {children}
  </th>
);

const TableCell = ({
  children,
  align = "right",
  strong,
}: {
  children: React.ReactNode;
  align?: "right" | "center";
  strong?: boolean;
}) => (
  <td
    className={`py-3 text-${align} text-xs ${
      strong ? "font-semibold text-gray-900" : "text-gray-700"
    }`}
  >
    {children}
  </td>
);

export default ShowSelectedSales;
