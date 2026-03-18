import { DisplaySalesDto, DisplaySalesItems } from "@/dtos/sales.dto";
import { ApiResponse } from "@/types/api";
import { fetcher } from "@/utils/fetcher";
import { formatPeso } from "@/utils/formatPeso";
import React, { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import Button from "@/components/shared/Button";
import LoaderComponent from "@/components/shared/LoaderComponent";
import {
  CreateSaleItemRefundDto,
  CreateSalePaymentRefundDto,
  CreateSalesRefundDto,
} from "@/dtos/sales-refund.dto";
import { useSession } from "@/hooks/useSession";
import { PaymentMethods } from "@/types/payment-methods";
import toast from "react-hot-toast";

interface RefundPageProps {
  salesData: DisplaySalesDto | null;
  onBack: () => void;
  mutateSales: () => void;
}

interface RefundItem extends CreateSaleItemRefundDto {
  prodName: string;
  prodVarName?: string;
  salesItemPrice: number;
  salesItemQuantity: number;
  salesItemTotal: number;
  selectedQty: number;
  selected: boolean;
}

interface RefundPaymentItem
  extends CreateSalePaymentRefundDto, PaymentMethods {}

type RefundReason =
  | "damaged"
  | "wrong_item"
  | "customer_changed_mind"
  | "defective"
  | "other";

const REFUND_REASONS: { value: RefundReason; label: string }[] = [
  { value: "damaged", label: "Damaged / Broken" },
  { value: "wrong_item", label: "Wrong Item Delivered" },
  { value: "customer_changed_mind", label: "Customer Changed Mind" },
  { value: "defective", label: "Defective Product" },
  { value: "other", label: "Other" },
];

const RefundPage = ({ salesData, onBack, mutateSales }: RefundPageProps) => {
  const { user } = useSession();
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const [reason, setReason] = useState<RefundReason | "">("");
  const [notes, setNotes] = useState("");
  const [step, setStep] = useState<
    "select" | "confirm" | "password" | "success"
  >("select");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: response, isLoading } = useSWR<
    ApiResponse<DisplaySalesItems[]>
  >(
    salesData?.salesId
      ? `/api/sales/${salesData.storeId}/${salesData.salesId}/sales-items`
      : null,
    fetcher,
  );
  const { data: paymentMethodResponse = { data: [] } } = useSWR<{
    data: PaymentMethods[];
  }>(
    salesData ? `/api/payment-method/store/${salesData.storeId}/` : null,
    fetcher,
  );

  const [refundItems, setRefundItems] = useState<RefundItem[]>([]);
  const [refundPayments, setRefundPayments] = useState<
    CreateSalePaymentRefundDto[]
  >([]);

  // Populate refund items once data loads
  useEffect(() => {
    if (response?.data) {
      setRefundItems(
        response.data.map((item) => ({
          salesItemId: item.salesItemId,
          prodName: item.prodName ?? "",
          prodVarName: item.prodVarName,
          salesItemPrice: item.salesItemPrice,
          salesItemQuantity: item.salesItemQuantity,
          salesItemTotal: item.salesItemTotal,
          selectedQty: item.salesItemQuantity,
          selected: false,
          salesRefId: 0,
          salesRefItemPrice: item.salesItemPrice,
          salesRefItemQty: item.salesItemQuantity,
        })),
      );
    }
  }, [response]);

  useEffect(() => {});

  const toggleItem = (id: string | number) => {
    setRefundItems((prev) =>
      prev.map((i) =>
        i.salesItemId === id ? { ...i, selected: !i.selected } : i,
      ),
    );
  };

  const updateQty = (id: string | number, qty: number) => {
    setRefundItems((prev) =>
      prev.map((i) =>
        i.salesItemId === id
          ? {
              ...i,
              selectedQty: Math.max(1, Math.min(qty, i.salesItemQuantity)),
            }
          : i,
      ),
    );
  };

  const totalPaymentMethodAmount = refundPayments.reduce(
    (sum, i) => sum + i.salesPayRefAmount,
    0,
  );
  const totalDiscounts = salesData?.salesDiscounts.reduce(
    (sum, i) => sum + Number(i.discountAmount),
    0,
  );
  const selectedItems = refundItems.filter((i) => i.selected);

  const refundTotal = selectedItems.reduce(
    (sum, item) => sum + item.salesItemPrice * item.selectedQty,
    0,
  );
  const totaRefundAmount =
    refundTotal - (refundTotal !== 0 ? Number(totalDiscounts) : 0);
  const exceedPaymentAmount = totalPaymentMethodAmount > totaRefundAmount;
  const belowRefundAmount = totalPaymentMethodAmount < totaRefundAmount;
  const correctAmount = totalPaymentMethodAmount === totaRefundAmount;

  useEffect(() => {
    if (refundPayments && refundPayments.length === 1) {
      setRefundPayments((prev) =>
        prev.map((p) => ({
          ...p,
          salesPayRefAmount: totaRefundAmount, // update amount to total refund
        })),
      );
    }
  }, [totaRefundAmount, refundPayments.length]);
  const canProceed = selectedItems.length > 0 && reason !== "" && correctAmount;
  const handlePasswordSubmit = async () => {};
  const handleSubmit = async () => {
    setIsSubmitting(true);
    const salesItemRefundData: CreateSaleItemRefundDto[] = refundItems
      .filter((i) => i.selected)
      .map((i) => ({
        salesItemId: i.salesItemId,
        salesRefId: 0,
        salesRefItemPrice: i.salesItemPrice,
        salesRefItemQty: i.selectedQty,
      }));
    const salesPaymentRefundData: CreateSalePaymentRefundDto[] =
      refundPayments.map((rp) => ({
        salesRefId: 0,
        salesPayRefAmount: totaRefundAmount,
        salesPayRefReference: rp.salesPayRefReference,
        payMetId: rp.payMetId,
      }));
    const salesRefundData: CreateSalesRefundDto = {
      salesId: salesData?.salesId ?? 0,
      salesRefAmount: totalPaymentMethodAmount, //add from salesItemRefund
      salesRefCreatedBy: user?.userId ?? 0,
      salesRefCreatedAt: new Date().toISOString(),
      storeId: salesData?.storeId ?? 0,
      salesItemRefunds: salesItemRefundData,
      salesPaymentRefunds: salesPaymentRefundData,
      salesRefReason: reason || notes,
    };

    try {
      const refundData = {
        data: salesRefundData,
        password: password,
      };
      // Replace with your actual API call
      await new Promise((res) => setTimeout(res, 1200));

      const res = await fetch(
        `/api/sales/${salesData?.storeId}/${salesData?.salesId}/refund`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(refundData),
        },
      );
      const result = await res.json();

      if (!result.success) {
        throw new Error(result.message || result.error);
      }
      toast.success(result.message);
      setStep("success");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDisplayName = (item: RefundItem) => {
    const varLower = (item.prodVarName ?? "").toLowerCase();
    const nameLower = (item.prodName ?? "").toLowerCase();
    return varLower.includes(nameLower)
      ? item.prodVarName
      : `${item.prodName} ${item.prodVarName ?? ""}`.trim();
  };

  if (isLoading) return <LoaderComponent />;

  /* ── SUCCESS STATE ── */
  if (step === "success") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 py-16">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">Refund Processed</h2>
          <p className="text-gray-500 mt-1">
            {formatPeso(totaRefundAmount)} will be returned to the customer.
          </p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 w-full max-w-sm text-sm text-gray-700 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-500">Invoice</span>
            <span className="font-medium">{salesData?.salesInvoice}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Items Refunded</span>
            <span className="font-medium">{selectedItems.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Reason</span>
            <span className="font-medium capitalize">
              {reason.replace("_", " ")}
            </span>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Refund Total</p>
              <p className="text-2xl font-bold text-gray-800">
                {formatPeso(totaRefundAmount)}
              </p>

              {selectedItems.length > 0 && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {selectedItems.length} item
                  {selectedItems.length > 1 ? "s" : ""} selected
                </p>
              )}

              {/* Show discount if it exists */}
              {totalDiscounts && totalDiscounts > 0 && (
                <p className="text-xs text-blue-700 mt-1">
                  Discount Applied: -{formatPeso(totalDiscounts)}
                </p>
              )}
            </div>

            <button
              onClick={() => setStep("confirm")}
              disabled={!canProceed}
              className="bg-red-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Review Refund →
            </button>
          </div>
        </div>
        <div>
          {" "}
          <Button
            label="Back to Sales"
            onClick={() => {
              mutateSales();
              onBack();
            }}
          />
        </div>
      </div>
    );
  }

  /* ── CONFIRM STATE ── */
  if (step === "confirm") {
    return (
      <div className="flex flex-col gap-6 max-w-2xl mx-auto py-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setStep("select")}
            className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Edit
          </button>
          <h2 className="text-xl font-bold text-gray-800">Confirm Refund</h2>
        </div>

        {/* Warning Banner */}
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <svg
            className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            />
          </svg>
          <p className="text-sm text-amber-700">
            This action cannot be undone. Please review the refund details
            carefully before confirming.
          </p>
        </div>

        {/* Summary */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {/* Items Summary */}
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Refund Summary</h3>
            <p className="text-sm text-gray-500">
              {salesData?.salesInvoice} · Order #{salesData?.salesNo}
            </p>
          </div>
          <div className="divide-y divide-gray-100 border-b border-gray-100">
            {selectedItems.map((item) => (
              <div
                key={String(item.salesItemId)}
                className="flex items-center justify-between px-5 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {getDisplayName(item)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatPeso(item.salesItemPrice)} × {item.selectedQty}
                  </p>
                </div>
                <span className="text-sm font-semibold text-gray-800">
                  {formatPeso(item.salesItemPrice * item.selectedQty)}
                </span>
              </div>
            ))}
          </div>
          {salesData?.salesDiscounts && salesData.salesDiscounts.length > 0 && (
            <div className="px-5 py-3">
              <h3 className="font-semibold text-gray-800">Discount</h3>
              {salesData.salesDiscounts.map((d) => (
                <div
                  key={String(d.salesDiscountId)}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-medium text-gray-800">
                      {/* {getDisplayName(item)} */ d.discountName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {d.discountType === "percent"
                        ? `(${d.discountValue}%)`
                        : d.discountValue}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-red-600">
                    {formatPeso(d.discountAmount)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Payment Refund Summary */}
          {refundPayments.length > 0 && (
            <div className="px-5 py-4 border-t border-gray-100">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Refunded via
              </h4>
              <div className="space-y-1">
                {refundPayments.map((p, idx) => {
                  const method = paymentMethodResponse.data.find(
                    (m) => m.payMetId === p.payMetId,
                  );
                  return (
                    <div
                      key={idx}
                      className="flex justify-between items-center text-sm text-gray-800"
                    >
                      <span>{method?.payMetName ?? "Unknown"}</span>
                      <span className="font-medium text-red-600">
                        {formatPeso(p.salesPayRefAmount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Total Refund */}
          <div className="px-5 py-4 bg-gray-50 flex justify-between items-center">
            <span className="font-semibold text-gray-700">Total Refund</span>
            <span className="text-lg font-bold text-red-600">
              {formatPeso(totaRefundAmount)}
            </span>
          </div>
        </div>

        {/* Reason */}
        <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 space-y-1">
          <p className="text-sm text-gray-500">Reason</p>
          <p className="font-medium text-gray-800 capitalize">
            {reason.replace("_", " ")}
          </p>
          {notes && (
            <>
              <p className="text-sm text-gray-500 pt-2">Notes</p>
              <p className="text-sm text-gray-700">{notes}</p>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => setStep("select")}
            className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Go Back
          </button>
          <button
            onClick={() => setStep("password")}
            disabled={isSubmitting}
            className="flex-1 bg-red-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                Processing…
              </>
            ) : (
              "Confirm Refund"
            )}
          </button>
        </div>
      </div>
    );
  }

  if (step === "password") {
    return (
      <div className="flex flex-col gap-6 max-w-2xl mx-auto py-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setStep("confirm")}
            className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>
          <h2 className="text-xl font-bold text-gray-800">Authorize Refund</h2>
        </div>

        {/* Lock Icon + Prompt */}
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="w-16 h-16 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-gray-800">
              Supervisor or Manager Authorization Required
            </p>
            <p className="text-sm text-gray-500 mt-0.5">
              Enter your password to authorize this{" "}
              <span className="font-medium text-red-600">
                {formatPeso(totaRefundAmount)}
              </span>{" "}
              refund.
            </p>
          </div>
        </div>

        {/* Refund snapshot */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 flex items-center justify-between text-sm">
          <div className="text-gray-500 space-y-1">
            <p>
              Invoice:{" "}
              <span className="font-medium text-gray-700">
                {salesData?.salesInvoice}
              </span>
            </p>
            <p>
              Items:{" "}
              <span className="font-medium text-gray-700">
                {selectedItems.length} item
                {selectedItems.length > 1 ? "s" : ""}
              </span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Total Refund</p>
            <p className="text-xl font-bold text-red-600">
              {formatPeso(totaRefundAmount)}
            </p>
          </div>
        </div>

        {/* Password Input */}
        <div className="bg-white border border-gray-200 rounded-xl px-5 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                ref={passwordInputRef}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isSubmitting) {
                    handlePasswordSubmit();
                  }
                }}
                placeholder="Enter your password"
                className={`w-full border rounded-lg px-4 py-2.5 pr-10 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                  passwordError
                    ? "border-red-400 focus:ring-red-300 bg-red-50"
                    : "border-gray-200 focus:ring-blue-500 focus:border-transparent"
                }`}
              />
              {/* Show/hide password toggle */}
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>

            {/* Error message */}
            {passwordError && (
              <div className="flex items-center gap-1.5 mt-2">
                <svg
                  className="w-4 h-4 text-red-500 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-xs text-red-600">{passwordError}</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => setStep("confirm")}
            disabled={isSubmitting}
            className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !password.trim()}
            className="flex-1 bg-red-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                Processing…
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                Authorize &amp; Process Refund
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  /* ── SELECT STATE (default) ── */
  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto py-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <button
          onClick={onBack}
          className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Process Refund</h2>
          <p className="text-sm text-gray-500">
            {salesData?.salesInvoice} · Order #{salesData?.salesNo}
          </p>
        </div>
      </div>

      {/* Step 1 — Select Items */}
      <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">
            Select Items to Refund
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Choose the items and quantities you want to refund.
          </p>
        </div>

        {refundItems.length === 0 ? (
          <p className="text-sm text-gray-500 px-5 py-6">
            No items found for this sale.
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {refundItems.map((item) => (
              <div
                key={String(item.salesItemId)}
                className={`flex items-center gap-4 px-5 py-4 transition-colors ${item.selected ? "bg-blue-50" : "hover:bg-gray-50"}`}
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggleItem(item.salesItemId)}
                  className={`w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${
                    item.selected
                      ? "bg-blue-600 border-blue-600"
                      : "border-gray-300"
                  }`}
                >
                  {item.selected && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>

                {/* Item info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {getDisplayName(item)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatPeso(item.salesItemPrice)} each ·{" "}
                    {item.salesItemQuantity} in order
                  </p>
                </div>

                {/* Qty selector */}
                {item.selected && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() =>
                        updateQty(item.salesItemId, item.selectedQty - 1)
                      }
                      disabled={item.selectedQty <= 1}
                      className="w-7 h-7 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-lg leading-none"
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">
                      {item.selectedQty}
                    </span>
                    <button
                      onClick={() =>
                        updateQty(item.salesItemId, item.selectedQty + 1)
                      }
                      disabled={item.selectedQty >= item.salesItemQuantity}
                      className="w-7 h-7 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-lg leading-none"
                    >
                      +
                    </button>
                  </div>
                )}

                {/* Subtotal */}
                <span className="text-sm font-semibold text-gray-800 w-20 text-right flex-shrink-0">
                  {formatPeso(
                    item.salesItemPrice *
                      (item.selected
                        ? item.selectedQty
                        : item.salesItemQuantity),
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
      <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between">
          <div className="flex flex-col">
            <h3 className="font-semibold text-gray-800">
              Payment Method for Refund
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Select how the refund will be returned to the customer.
            </p>
          </div>
          <div className="flex flex-col items-center">
            <h3
              className={`font-semibold  ${exceedPaymentAmount ? `text-red-800` : belowRefundAmount ? `text-red-800` : `text-green-800`}`}
            >
              {formatPeso(totaRefundAmount)}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Total Payment Refund</p>
          </div>
        </div>

        <div className="px-5 py-4 space-y-3">
          {refundPayments.map((payment, index) => {
            return (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                {/* Payment Method Dropdown */}
                <select
                  value={payment.payMetId}
                  onChange={(e) => {
                    const newPayMetId = Number(e.target.value);
                    setRefundPayments((prev) =>
                      prev.map((p, i) =>
                        i === index ? { ...p, payMetId: newPayMetId } : p,
                      ),
                    );
                  }}
                  className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {paymentMethodResponse.data
                    .filter(
                      (method) =>
                        !refundPayments.some(
                          (p, idx) =>
                            p.payMetId === method.payMetId && idx !== index,
                        ),
                    )
                    .map((method) => (
                      <option key={method.payMetId} value={method.payMetId}>
                        {method.payMetName}
                      </option>
                    ))}
                </select>

                {/* Refund Amount Input */}
                <input
                  type="number"
                  value={
                    payment.salesPayRefAmount === 0
                      ? ""
                      : payment.salesPayRefAmount
                  }
                  min={0}
                  max={totaRefundAmount}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setRefundPayments((prev) =>
                      prev.map((p, i) =>
                        i === index ? { ...p, salesPayRefAmount: val } : p,
                      ),
                    );
                  }}
                  className="w-24 text-right text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />

                {/* Remove button */}
                {refundPayments.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setRefundPayments((prev) =>
                        prev.filter((_, i) => i !== index),
                      );
                    }}
                    className="text-red-500 hover:text-red-700 text-sm font-semibold"
                  >
                    Remove
                  </button>
                )}
              </div>
            );
          })}

          {/* Add New Payment Method */}
          {refundPayments.length < paymentMethodResponse.data.length && (
            <button
              type="button"
              onClick={() => {
                const availableMethod = paymentMethodResponse.data.find(
                  (m) => !refundPayments.some((p) => p.payMetId === m.payMetId),
                );
                if (!availableMethod) return;
                setRefundPayments((prev) => [
                  ...prev,
                  {
                    payMetId: availableMethod.payMetId,
                    salesPayRefAmount: 0,
                    salesRefId: 0,
                    salesPayRefReference: "",
                  },
                ]);
              }}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              + Add Payment Method
            </button>
          )}
        </div>
      </section>
      {/* Step 2 — Reason */}
      <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Reason for Refund</h3>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {REFUND_REASONS.map((r) => (
              <button
                key={r.value}
                onClick={() => setReason(r.value)}
                className={`text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
                  reason === r.value
                    ? "border-blue-600 bg-blue-50 text-blue-700 font-medium"
                    : "border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1.5">
              Additional Notes <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Describe the issue in more detail…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
        </div>
      </section>

      {/* Refund Total Footer */}
      <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Refund Total</p>
          <p className="text-2xl font-bold text-gray-800">
            {formatPeso(totaRefundAmount)}
          </p>
          {selectedItems.length > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">
              {selectedItems.length} item{selectedItems.length > 1 ? "s" : ""}{" "}
              selected
            </p>
          )}
        </div>
        <button
          onClick={() => setStep("confirm")}
          disabled={!canProceed}
          className="bg-red-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Review Refund →
        </button>
      </div>
    </div>
  );
};

export default RefundPage;
