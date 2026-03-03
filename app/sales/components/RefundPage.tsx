import { DisplaySalesDto, DisplaySalesItems } from "@/dtos/sales.dto";
import { ApiResponse } from "@/types/api";
import { fetcher } from "@/utils/fetcher";
import { formatPeso } from "@/utils/formatPeso";
import React, { useEffect, useState } from "react";
import useSWR from "swr";
import Button from "@/components/shared/Button";
import LoaderComponent from "@/components/shared/LoaderComponent";

interface RefundPageProps {
  salesData: DisplaySalesDto | null;
  onBack: () => void;
}

interface RefundItem {
  salesItemId: string | number;
  prodName: string;
  prodVarName?: string;
  salesItemPrice: number;
  salesItemQuantity: number;
  salesItemTotal: number;
  selectedQty: number;
  selected: boolean;
}

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

const RefundPage = ({ salesData, onBack }: RefundPageProps) => {
  const [reason, setReason] = useState<RefundReason | "">("");
  const [notes, setNotes] = useState("");
  const [step, setStep] = useState<"select" | "confirm" | "success">("select");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: response, isLoading } = useSWR<
    ApiResponse<DisplaySalesItems[]>
  >(
    salesData?.salesId
      ? `/api/sales/${salesData.storeId}/${salesData.salesId}/sales-items`
      : null,
    fetcher,
  );

  const [refundItems, setRefundItems] = useState<RefundItem[]>([]);

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
        })),
      );
    }
  }, [response]);

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

  const selectedItems = refundItems.filter((i) => i.selected);

  const refundTotal = selectedItems.reduce(
    (sum, item) => sum + item.salesItemPrice * item.selectedQty,
    0,
  );

  const canProceed = selectedItems.length > 0 && reason !== "";

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Replace with your actual API call
      await new Promise((res) => setTimeout(res, 1200));
      /*
      await fetch(`/api/sales/${salesData?.storeId}/${salesData?.salesId}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason,
          notes,
          items: selectedItems.map((i) => ({
            salesItemId: i.salesItemId,
            quantity: i.selectedQty,
            amount: i.salesItemPrice * i.selectedQty,
          })),
          totalRefundAmount: refundTotal,
        }),
      });
      */
      setStep("success");
    } catch (e) {
      console.error(e);
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
            {formatPeso(refundTotal)} will be returned to the customer.
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
          <div className="flex justify-between border-t pt-2 mt-2">
            <span className="font-semibold">Refund Total</span>
            <span className="font-bold text-green-600">
              {formatPeso(refundTotal)}
            </span>
          </div>
        </div>
        <div>
          {" "}
          <Button label="Back to Sales" onClick={onBack} />
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
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Refund Summary</h3>
            <p className="text-sm text-gray-500">
              {salesData?.salesInvoice} · Order #{salesData?.salesNo}
            </p>
          </div>
          <div className="divide-y divide-gray-100">
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
          <div className="px-5 py-4 bg-gray-50 flex justify-between items-center">
            <span className="font-semibold text-gray-700">Total Refund</span>
            <span className="text-lg font-bold text-red-600">
              {formatPeso(refundTotal)}
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
            onClick={handleSubmit}
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
            {formatPeso(refundTotal)}
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
