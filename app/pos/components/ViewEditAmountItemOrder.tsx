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

  /** preload existing discount (edit mode) */
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

  /** calculate discount dynamically */
  const discountAmount = useMemo(() => {
    if (!selectedDiscount) return 0;

    if (selectedDiscount.discountType === "percent") {
      return baseTotal * (selectedDiscount.discountValue / 100);
    }

    return selectedDiscount.discountValue;
  }, [selectedDiscount, baseTotal]);

  /** base price always comes from price × qty */

  const finalTotal = Math.max(0, baseTotal - discountAmount);

  /** manual edit cancels discount */
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

  /** select / replace / remove discount */
  const handleDiscountChange = (value: number) => {
    if (!value) {
      // remove discount
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

  /** save to POS */
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
    <div className="flex flex-col gap-4 p-4 bg-white rounded-lg shadow-sm h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">
          Edit Item Amount
        </h2>
        {selectedDiscount && (
          <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded">
            Discount Applied
          </span>
        )}
      </div>

      {/* Amount */}
      <Input
        label="Final Amount"
        sizes="sm"
        value={selectedDiscount ? finalTotal : form?.prodVarTotal}
        onChange={(e) => handleManualAmountChange(Number(e.target.value))}
      />

      {/* Discount Selector */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">Discount</label>
        <select
          className="border rounded px-2 py-1 text-xs"
          value={selectedDiscount?.discountId ?? ""}
          onChange={(e) => handleDiscountChange(Number(e.target.value))}
        >
          <option value="">No discount</option>
          {discountData.map((d) => (
            <option key={d.discountId} value={d.discountId}>
              {d.discountName} (
              {d.discountType === "percent"
                ? `${d.discountValue}%`
                : `₱${d.discountValue}`}
              )
            </option>
          ))}
        </select>
      </div>

      {/* Summary */}
      <div className="text-xs text-gray-600 space-y-1">
        <div>Base: ₱{baseTotal.toFixed(2)}</div>
        {selectedDiscount && (
          <>
            <div className="text-green-600">
              Discount: −₱{discountAmount.toFixed(2)}
            </div>
            <div className="font-semibold">Final: ₱{finalTotal.toFixed(2)}</div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 mt-auto">
        <Button label="Cancel" size="sm" color="secondary" onClick={onClose} />
        <Button label="Save" size="sm" onClick={handleSave} />
      </div>
    </div>
  );
};

export default ViewEditAmountItemOrder;
