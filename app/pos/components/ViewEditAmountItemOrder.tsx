import React, { useMemo, useState } from "react";
import { OrderList } from "../PosPage";
import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import { Discounts } from "@/types/discount";

interface Props {
  data: OrderList | null;
  discountData: Discounts[];
  onClose: () => void;
  updateOrderList: (data: OrderList) => void;
}

const ViewEditAmountItemOrder = ({
  data,
  discountData,
  updateOrderList,
  onClose,
}: Props) => {
  const [form, setForm] = useState<OrderList | null>(data);

  const [selectedDiscount, setSelectedDiscount] = useState<Discounts | null>(
    () => {
      if (!data?.discounts?.length) return null;

      const applied = data.discounts[0];

      return (
        discountData.find((d) => d.discountId === applied.discountId) ?? null
      );
    },
  );

  const baseTotal = useMemo(() => {
    const price = Number(form?.prodVarPrice ?? 0);
    const qty = Number(form?.quantity ?? 0);

    return price * qty;
  }, [form?.prodVarPrice, form?.quantity]);

  const discountAmount = useMemo(() => {
    if (!selectedDiscount) return 0;

    if (selectedDiscount.discountType === "percent") {
      return baseTotal * (selectedDiscount.discountValue / 100);
    }

    return selectedDiscount.discountValue;
  }, [selectedDiscount, baseTotal]);

  const finalTotal = Math.max(0, baseTotal - discountAmount);

  const handleManualAmountChange = (value: number) => {
    setSelectedDiscount(null);

    setForm((prev) =>
      prev
        ? {
            ...prev,
            prodVarTotal: value,
            discounts: [],
          }
        : prev,
    );
  };

  const handleDiscountChange = (value: number) => {
    if (!value) {
      setSelectedDiscount(null);

      setForm((prev) =>
        prev
          ? {
              ...prev,
              prodVarTotal: baseTotal,
              discounts: [],
            }
          : prev,
      );

      return;
    }

    const found = discountData.find((d) => d.discountId === value);
    setSelectedDiscount(found ?? null);
  };

  const handleSave = () => {
    if (!form) return;

    updateOrderList({
      ...form,
      prodVarTotal: selectedDiscount
        ? Number(finalTotal.toFixed(2))
        : Number(form.prodVarTotal ?? 0),
      discounts: selectedDiscount
        ? [
            {
              salesItemId: 0,
              discountId: selectedDiscount.discountId,
              discountType: selectedDiscount.discountType,
              discountAmount: Number(discountAmount.toFixed(2)),
              salesItemDiscCreatedBy: 0,
            },
          ]
        : [],
    });

    onClose();
  };

  return (
    <div className="flex h-full flex-col rounded-2xl bg-white p-5">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Edit Amount</h2>
          <p className="mt-1 text-xs text-gray-400">
            Adjust item total or apply a discount.
          </p>
        </div>

        {selectedDiscount && (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-600">
            Discount applied
          </span>
        )}
      </div>

      {/* Amount */}
      <div className="space-y-2">
        <Input
          label="Final Amount"
          sizes="sm"
          value={selectedDiscount ? finalTotal : form?.prodVarTotal}
          onChange={(e) => handleManualAmountChange(Number(e.target.value))}
        />
      </div>

      {/* Discount */}
      <div className="mt-5 space-y-2">
        <label className="text-xs font-medium text-gray-500">Discount</label>

        <select
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-gray-300 focus:bg-white"
          value={selectedDiscount?.discountId ?? ""}
          onChange={(e) => handleDiscountChange(Number(e.target.value))}
        >
          <option value="">No discount</option>

          {discountData.map((d) => (
            <option key={d.discountId} value={d.discountId}>
              {d.discountName}{" "}
              {d.discountType === "percent"
                ? `(${d.discountValue}%)`
                : `(₱${d.discountValue})`}
            </option>
          ))}
        </select>
      </div>

      {/* Summary */}
      <div className="mt-5 rounded-2xl border border-gray-100 bg-gray-50 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Base</span>
          <span className="font-medium text-gray-700">
            ₱{baseTotal.toFixed(2)}
          </span>
        </div>

        {selectedDiscount && (
          <>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-gray-400">Discount</span>
              <span className="font-medium text-emerald-600">
                −₱{discountAmount.toFixed(2)}
              </span>
            </div>

            <div className="my-3 border-t border-gray-200" />

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Final</span>
              <span className="text-lg font-semibold text-gray-900">
                ₱{finalTotal.toFixed(2)}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="mt-auto flex justify-end gap-2 pt-6">
        <Button label="Cancel" size="sm" color="secondary" onClick={onClose} />
        <Button label="Save Changes" size="sm" onClick={handleSave} />
      </div>
    </div>
  );
};

export default ViewEditAmountItemOrder;
