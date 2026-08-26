import Button from "@/components/shared/Button";
import LoaderComponent from "@/components/shared/LoaderComponent";
import Modal from "@/components/shared/Modal";

import { DisplaySalesDto, DisplaySalesItems } from "@/dtos/sales.dto";
import { ApiResponse } from "@/types/api";
import { fetcher } from "@/utils/fetcher";
import { formatDateToWords } from "@/utils/formatDateToWords";
import { formatPeso } from "@/utils/formatPeso";
import Link from "next/link";
import React, { useState } from "react";
import toast from "react-hot-toast";
import useSWR, { mutate } from "swr";
import { formatDiscountValue } from "../pos/components/sidebar/DiscountList";
import RefundPage from "./components/RefundPage";
import EditSalesPage from "./components/EditSalesPage";
import { SalesStatus } from "@/types/sales";
import { getSalesStatusOption } from "@/utils/salesUtils";
import PrintSales from "./components/PrintSales";
import { useSession } from "@/hooks/useSession";

interface SelectedSalesPageProps {
  salesData: DisplaySalesDto | null;
  onBack: () => void;
  mutateSales: () => void;
}
const SelectedSalesPage = ({
  mutateSales,
  salesData,
  onBack,
}: SelectedSalesPageProps) => {
  const { user } = useSession();
  const [showViews, setShowViews] = useState<
    null | "refund" | "edit" | "print"
  >(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const {
    data: response,
    mutate,
    isLoading,
  } = useSWR<ApiResponse<DisplaySalesItems[]>>(
    salesData?.salesId
      ? `/api/sales/${salesData.storeId}/${salesData.salesId}/sales-items`
      : null,
    fetcher,
  );

  const updateDataSales = async () => {
    console.log("Check update");
    mutateSales();
    await mutate();
  };

  // Same allowlist as the server-side gate in approveSaleController -
  // owner/superadmin/admin/accounting are trusted to clear a sale a
  // staff/supervisor submitted for approval.
  const canApproveSale =
    Boolean(user?.userRole && ["owner", "superadmin"].includes(user.userRole)) ||
    Boolean(
      user?.empPosition && ["admin", "accounting"].includes(user.empPosition),
    );

  const handleApproveSale = async () => {
    if (!salesData?.salesId || !salesData?.storeId) return;
    setIsApproving(true);
    try {
      const res = await fetch(
        `/api/sales/${salesData.storeId}/${salesData.salesId}/approve`,
        { method: "POST" },
      );
      const result = await res.json();
      if (!result.success) {
        throw new Error(result.message);
      }
      toast.success(`Sale ${salesData.salesNo} approved.`);
      await updateDataSales();
    } catch (e: any) {
      toast.error(e.message || "Failed to approve sale.");
    } finally {
      setIsApproving(false);
    }
  };

  const handleRejectSale = async () => {
    if (!salesData?.salesId || !salesData?.storeId) return;
    setIsRejecting(true);
    try {
      const res = await fetch(
        `/api/sales/${salesData.storeId}/${salesData.salesId}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: rejectReason.trim() || undefined }),
        },
      );
      const result = await res.json();
      if (!result.success) {
        throw new Error(result.message);
      }
      toast.success(`Sale ${salesData.salesNo} rejected.`);
      setShowRejectModal(false);
      setRejectReason("");
      await updateDataSales();
    } catch (e: any) {
      toast.error(e.message || "Failed to reject sale.");
    } finally {
      setIsRejecting(false);
    }
  };

  const canEditUser =
    user?.userRole &&
    Boolean(
      ["owner", "superadmin"].includes(user?.userRole) ||
      Boolean(
        user?.empPosition &&
        ["admin", "accounting"].includes(user?.empPosition),
      ),
    );
  const refundTotal =
    Array.isArray(salesData?.salesRefunds) && salesData.salesRefunds.length > 0
      ? salesData.salesRefunds.reduce(
          (total, s) => Number(total) + Number(s.salesRefAmount),
          0,
        )
      : 0;
  const voucherTotal =
    Array.isArray(salesData?.vouchers) && salesData.vouchers.length > 0
      ? salesData.vouchers.reduce(
          (total, v) => Number(total) + Number(v.salesVoucherAmount),
          0,
        )
      : 0;
  const { label, bg, color, border } = getSalesStatusOption(
    salesData?.salesStatus ?? "",
  );
  if (isLoading) return <LoaderComponent />;
  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      {!showViews ? (
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
          <div className="bg-white rounded-lg border border-gray-200 p-3 2xl:p-6 mb-2 2xl:mb-4">
            <div className="flex justify-between items-start mb-3 2xl:mb-6">
              <div>
                <p className="text-sm  font-semibold">
                  Order #{salesData?.salesNo}
                </p>
                <div className="mt-2">
                  <div className="text-[10px] 2xl:text-xs text-gray-500 mb-1">
                    Total Amount
                  </div>
                  <div className="text-sm 2xl:text-2xl font-semibold text-gray-900">
                    {formatPeso(
                      Number(salesData?.salesTotalAmount) - Number(refundTotal),
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col 2xl:flex-row items-center gap-3">
                <div className="flex items-center gap-2">
                  <div>
                    <Button
                      label="Print"
                      color="outline"
                      size="sm"
                      onClick={() => setShowViews("print")}
                    />
                  </div>
                  <div>
                    <Button label="Download PDF" color="outline" size="sm" />
                  </div>
                  {canEditUser && (
                    <div>
                      <Button
                        label="Edit"
                        size="sm"
                        color="outline"
                        hasBorder={false}
                        onClick={() => {
                          setShowViews("edit");
                        }}
                      />
                    </div>
                  )}
                  {canApproveSale &&
                    salesData?.salesStatus ===
                      SalesStatus.PENDING_APPROVAL && (
                      <>
                        <div>
                          <Button
                            label="Reject"
                            size="sm"
                            color="danger"
                            hasBorder={false}
                            onClick={() => setShowRejectModal(true)}
                            disabled={isApproving || isRejecting}
                          />
                        </div>
                        <div>
                          <Button
                            label={isApproving ? "Approving..." : "Approve"}
                            size="sm"
                            hasBorder={false}
                            onClick={handleApproveSale}
                            disabled={isApproving || isRejecting}
                          />
                        </div>
                      </>
                    )}
                  <div>
                    <Button
                      label={
                        salesData?.salesStatus === SalesStatus.REFUNDED
                          ? "Refunded"
                          : "Refund"
                      }
                      size="sm"
                      hasBorder={false}
                      onClick={() => {
                        setShowViews("refund");
                      }}
                      disabled={salesData?.salesStatus === SalesStatus.REFUNDED}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-3 2xl:gap-6 pt-2 2xl:pt-4 border-t border-gray-200">
              <div>
                <div className="text-[10px] 2xl:text-xs text-gray-500 mb-1">
                  Customer
                </div>
                <div className="text-xs 2xl:text-sm font-medium text-gray-900">
                  {salesData?.customerName || "Walk-in Customer"}
                </div>
              </div>
              <div>
                <div className="text-[10px] 2xl:text-xs text-gray-500 mb-1">
                  Store
                </div>
                <div className="text-xs 2xl:text-sm font-medium text-gray-900">
                  {salesData?.storeName}
                </div>
              </div>
              <div>
                <div className="text-[10px] 2xl:text-xs text-gray-500 mb-1">
                  Date
                </div>
                <div className="text-xs 2xl:text-sm font-medium text-gray-900">
                  {formatDateToWords(salesData?.salesCreatedAt ?? "", {
                    showHour: true,
                    showMinute: true,
                  })}
                </div>
              </div>
              <div>
                <div className="text-[10px] 2xl:text-xs text-gray-500 mb-1">
                  Source
                </div>
                {salesData?.salesSource === "order" && salesData?.orderId ? (
                  <Link
                    href={`/orders/${salesData.orderId}`}
                    className="inline-flex px-2 py-1 text-center font-semibold text-[11px] 2xl:text-xs rounded-2xl bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                  >
                    Order
                  </Link>
                ) : (
                  <div
                    className={`inline-flex px-2 py-1 text-center font-semibold text-[11px] 2xl:text-xs rounded-2xl ${
                      salesData?.salesSource === "order"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {salesData?.salesSource === "order" ? "Order" : "POS"}
                  </div>
                )}
              </div>
              <div>
                <div className="text-[10px] 2xl:text-xs text-gray-500 mb-1">
                  Status
                </div>
                <div
                  className={`px-1 py-1.5 text-center font-semibold text-[11px] 2xl:text-xs rounded-2xl ${bg} ${color} ${border}`}
                >
                  {label}
                </div>
              </div>
            </div>
          </div>
          {salesData?.salesRemarks && (
            <div className="bg-white rounded-lg border border-gray-200 p-3 2xl:p-6 mb-2 2xl:mb-4">
              {" "}
              <h2 className="text-sm 2xl:text-base font-semibold text-gray-900 mb-4">
                Notes
              </h2>
              <span className="text-xs 2xl:text-sm">
                {salesData?.salesRemarks}
              </span>
            </div>
          )}
          <div className="bg-white rounded-lg border border-gray-200 p-3 2xl:p-6 mb-2 2xl:mb-4">
            <h2 className="text-sm 2xl:text-base font-semibold text-gray-900 mb-2 2xl:mb-4">
              Items ({salesData?.totalItem})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left text-[10px] 2xl:text-xs font-medium text-gray-500 uppercase tracking-wider pb-1.5 2xl:pb-3">
                      Description
                    </th>
                    <th className="text-right text-[10px] 2xl:text-xs font-medium text-gray-500 uppercase tracking-wider pb-1.5 2xl:pb-3">
                      Price
                    </th>
                    <th className="text-center text-[10px] 2xl:text-xs font-medium text-gray-500 uppercase tracking-wider pb-1.5 2xl:pb-3">
                      Qty
                    </th>

                    <th className="text-center text-[10px] 2xl:text-xs font-medium text-red-500 uppercase tracking-wider pb-1.5 2xl:pb-3">
                      Refund Qty
                    </th>

                    <th className="text-right text-[10px] 2xl:text-xs font-medium text-gray-500 uppercase tracking-wider pb-1.5 2xl:pb-3">
                      Subtotal
                    </th>
                    <th className="text-right text-[10px] 2xl:text-xs font-medium text-gray-500 uppercase tracking-wider pb-1.5 2xl:pb-3">
                      Discount
                    </th>
                    <th className="text-right text-[10px] 2xl:text-xs font-medium text-gray-500 uppercase tracking-wider pb-1.5 2xl:pb-3">
                      Total
                    </th>
                    <th className="text-right text-[10px] 2xl:text-xs font-medium text-gray-500 uppercase tracking-wider pb-1.5 2xl:pb-3">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {response?.data?.map((item, index) => {
                    const modifyName = (item.prodVarName ?? "")
                      .toLowerCase()
                      .includes((item.prodName ?? "").toLowerCase())
                      ? item.prodVarName
                      : `${item.prodName ?? ""} ${item.prodVarName ?? ""}`.trim();
                    return (
                      <tr
                        key={item.salesItemId}
                        className={
                          index !== (response?.data?.length ?? 0) - 1
                            ? "border-b border-gray-100"
                            : ""
                        }
                      >
                        <td className="py-2">
                          <div className="text-xs 2xl:text-sm font-medium text-gray-900">
                            {modifyName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.prodVarUnit}
                          </div>
                        </td>
                        <td className="py-2 text-right text-xs 2xl:text-sm text-gray-700">
                          {formatPeso(item.salesItemPrice)}
                        </td>
                        <td className="py-2 text-center text-xs 2xl:text-sm text-gray-700">
                          {Number(item.salesItemQuantity).toFixed(0)}
                        </td>

                        {Boolean(
                          item.salesItemsRefunds &&
                          item.salesItemsRefunds.length > 0,
                        ) ? (
                          <td className="py-2 text-center text-xs 2xl:text-sm text-gray-700">
                            {item.salesItemsRefunds?.reduce(
                              (count, i) => i.salesRefItemQty + count,
                              0,
                            )}
                          </td>
                        ) : (
                          <td className="py-2 text-center text-xs 2xl:text-sm text-gray-700">
                            -
                          </td>
                        )}
                        <td className="py-2 text-right text-xs 2xl:text-sm font-normal text-gray-900">
                          {formatPeso(item.salesItemSubtotal)}
                        </td>
                        <td className="py-2 text-right text-xs 2xl:text-sm text-gray-700">
                          {item.salesItemDiscounts?.map((dis) => {
                            const formatDiscount =
                              dis.discountType === "percent"
                                ? `${formatDiscountValue(dis.discountValue)}%`
                                : `${formatPeso(dis.discountValue)}`;
                            return `${formatDiscount} (${formatPeso(dis.discountAmount)})`;
                          })}
                        </td>

                        <td className="py-2 text-right text-xs 2xl:text-sm font-medium text-gray-900">
                          {formatPeso(item.salesItemTotal)}
                        </td>
                        <td className="py-2 text-right text-xs 2xl:text-sm font-medium text-gray-900">
                          {item.salesItemStatus === "active" ? "completed" : ""}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-3 2xl:mt-6 pt-2 2xl:pt-4 border-t border-gray-200 w-full">
              {/* Subtotal */}
              <div className="flex justify-between mb-2">
                <div className="text-xs 2xl:text-sm text-gray-600 w-32">
                  Subtotal
                </div>
                <div className="text-xs 2xl:text-sm text-gray-900 w-24 text-right">
                  {formatPeso(salesData?.salesSubTotal ?? 0)}
                </div>
              </div>

              {/* Voucher */}
              {Boolean(voucherTotal && voucherTotal !== 0) && (
                <div className="flex justify-between mb-2">
                  <div className="text-xs 2xl:text-sm text-primary-1 w-32">
                    Voucher{(salesData?.vouchers?.length ?? 0) > 1 ? "s" : ""}
                  </div>
                  <div className="text-xs 2xl:text-sm text-primary-1 w-24 text-right">
                    - {formatPeso(voucherTotal)}
                  </div>
                </div>
              )}

              {Boolean(refundTotal && refundTotal !== 0) && (
                <div className="flex justify-between mb-2">
                  <div className="text-xs 2xl:text-sm text-red-600 w-32">
                    Refund
                  </div>
                  <div className="text-xs 2xl:text-sm text-red-900 w-24 text-right">
                    {formatPeso(refundTotal ?? 0)}
                  </div>
                </div>
              )}

              {/* Discounts */}
              {salesData?.salesDiscounts &&
                salesData.salesDiscounts.length > 0 && (
                  <div className="flex justify-between mb-3">
                    <div className="text-xs 2xl:text-sm text-gray-600 w-32">
                      Discounts
                    </div>

                    <div className="flex flex-col  items-end gap-1">
                      {salesData.salesDiscounts?.map((disc) => (
                        <div
                          key={disc.salesDiscountId}
                          className="flex justify-between w-full text-xs 2xl:text-sm text-gray-500"
                        >
                          <span className="truncate text-right">
                            {disc.discountName}{" "}
                            {disc.discountType === "percent"
                              ? `(${disc.discountValue}%)`
                              : `₱${disc.discountValue.toFixed(2)}`}
                          </span>
                          <span className="text-red-600 font-semibold ml-2">
                            - {formatPeso(disc.discountAmount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Total */}
              <div className="flex justify-between pt-3 border-t border-gray-200">
                <div className="text-xs 2xl:text-sm font-semibold text-gray-900 w-32">
                  Total
                </div>
                <div className="text-xs 2xl:text-sm font-semibold text-gray-900 w-24 text-right">
                  {formatPeso(
                    Number(
                      Number(salesData?.salesTotalAmount) - Number(refundTotal),
                    ) ?? 0,
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-4 w-full">
            <h2 className="text-sm 2xl:text-base font-semibold text-gray-900 mb-4">
              Payment Methods
            </h2>

            {/* Summary Section */}
            <div className="pt-2 2xl:pt-4 mt-2 2xl:mt-4 border-t border-gray-200 space-y-2">
              <div className="flex justify-between items-center">
                <div className="text-xs 2xl:text-sm font-medium text-gray-900">
                  Amount Due
                </div>
                <div className="text-sm 2xl:text-base font-semibold text-gray-900">
                  {formatPeso(salesData?.salesTotalAmount ?? 0)}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-xs 2xl:text-sm text-gray-600">
                  Total Paid
                </div>
                <div className="text-xs 2xl:text-sm text-gray-900">
                  {formatPeso(salesData?.salesTotalAmount ?? 0)}
                </div>
              </div>

              {/* Refund Total */}
              {Boolean(refundTotal && refundTotal !== 0) && (
                <div className="flex justify-between items-center">
                  <div className="text-xs 2xl:text-sm text-red-600">
                    Refunded
                  </div>
                  <div className="text-xs 2xl:text-sm text-red-900">
                    - {formatPeso(refundTotal)}
                  </div>
                </div>
              )}

              {/* Adjusted Paid */}
              {Boolean(refundTotal && refundTotal !== 0) && (
                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                  <div className="text-xs 2xl:text-sm font-medium text-gray-900">
                    Net Paid
                  </div>
                  <div className="text-sm 2xl:text-base font-semibold text-gray-900">
                    {formatPeso(
                      Number(salesData?.salesTotalAmount ?? 0) -
                        Number(refundTotal),
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Payment Methods Details */}
            {salesData?.paymentMethods &&
              salesData.paymentMethods.length > 0 && (
                <div className="mt-2 2xl:mt-4 pt-2 2xl:pt-4 border-t border-gray-200 space-y-2">
                  <h3 className="text-xs 2xl:text-sm font-medium text-gray-900 mb-2">
                    Payment Details
                  </h3>
                  {salesData.paymentMethods?.map((pay) => {
                    // Calculate refunded amount per payment method if needed
                    const refundedForMethod =
                      salesData.salesPaymentRefunds
                        ?.filter((r) => r.payMetId === pay.payMetId)
                        .reduce(
                          (sum, r) => sum + Number(r.salesPayRefAmount),
                          0,
                        ) ?? 0;

                    const netPayment =
                      Number(pay.salesPaymentAmount) - refundedForMethod;

                    return (
                      <div
                        key={pay.salesPaymentId}
                        className="flex justify-between items-center text-xs 2xl:text-sm text-gray-700 px-1 py-1 bg-gray-50 rounded"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {pay?.payMetName ?? "Unknown"}
                          </span>
                          {pay?.paymentReference && (
                            <span className="text-gray-500 text-xs truncate">
                              Ref: {pay.paymentReference || "-"}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="font-semibold text-gray-900">
                            {formatPeso(netPayment)}
                          </span>
                          {refundedForMethod > 0 && (
                            <span className="text-red-600 text-xs">
                              - {formatPeso(refundedForMethod)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            {/* Final Total Paid */}
            <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-200">
              <div className="text-xs 2xl:text-sm font-medium text-gray-900">
                Total Paid
              </div>
              <div className="text-sm 2xl:text-base font-semibold text-gray-900">
                {formatPeso(
                  Number(salesData?.salesTotalAmount ?? 0) - (refundTotal ?? 0),
                )}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-sm 2xl:text-base font-semibold text-gray-900 mb-4">
              Additional Information
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Created By</div>
                <div className="text-xs 2xl:text-sm text-gray-900">
                  {salesData?.salesCreatedByName}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Last Updated</div>
                <div className="text-xs 2xl:text-sm text-gray-900">
                  {formatDateToWords(salesData?.salesUpdatedAt ?? "")}
                </div>
              </div>
            </div>
          </div>
          {salesData?.salesApprovedBy &&
            (() => {
              const isRejected = salesData.salesStatus === SalesStatus.REJECTED;
              return (
                <div className="bg-white rounded-lg border border-gray-200 p-6 mt-2 2xl:mt-4">
                  <h2 className="text-sm 2xl:text-base font-semibold text-gray-900 mb-4">
                    {isRejected ? "Rejection Information" : "Approval Information"}
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">
                        {isRejected ? "Rejected By" : "Approved By"}
                      </div>
                      <div className="text-xs 2xl:text-sm text-gray-900">
                        {salesData?.salesApprovedByName || "-"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">
                        {isRejected ? "Rejected At" : "Approved At"}
                      </div>
                      <div className="text-xs 2xl:text-sm text-gray-900">
                        {formatDateToWords(salesData?.salesApprovedAt ?? "", {
                          showHour: true,
                          showMinute: true,
                        })}
                      </div>
                    </div>
                    {isRejected && salesData?.salesRejectionReason && (
                      <div className="col-span-2">
                        <div className="text-xs text-gray-500 mb-1">
                          Reason
                        </div>
                        <div className="text-xs 2xl:text-sm text-gray-900">
                          {salesData.salesRejectionReason}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
        </div>
      ) : showViews === "refund" ? (
        <RefundPage
          salesData={salesData}
          onBack={() => setShowViews(null)}
          mutateSales={updateDataSales}
        />
      ) : showViews === "edit" ? (
        <EditSalesPage
          salesData={salesData}
          onBack={() => setShowViews(null)}
          mutateSales={updateDataSales}
        />
      ) : showViews === "print" ? (
        <PrintSales salesData={salesData} onBack={() => setShowViews(null)} />
      ) : (
        <div></div>
      )}
      <Modal
        title="Reject Sale"
        subtitle={`Reject sale ${salesData?.salesNo ?? ""}? This can't be undone.`}
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setRejectReason("");
        }}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              label="Cancel"
              size="sm"
              color="outline"
              onClick={() => {
                setShowRejectModal(false);
                setRejectReason("");
              }}
              disabled={isRejecting}
            />
            <Button
              label={isRejecting ? "Rejecting..." : "Reject Sale"}
              size="sm"
              color="danger"
              onClick={handleRejectSale}
              disabled={isRejecting}
            />
          </div>
        }
      >
        <textarea
          className="w-full rounded-lg border border-gray-200 p-2 text-xs 2xl:text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary-1"
          rows={4}
          placeholder="Reason for rejecting this sale (optional)"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
      </Modal>
    </div>
  );
};

export default SelectedSalesPage;
