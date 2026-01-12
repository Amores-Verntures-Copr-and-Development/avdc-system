import Button from "@/components/shared/Button";
import { Discounts } from "@/types/discount";
import { Plus, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { CreateSalesDiscount } from "@/dtos/sales.dto";
import { formatDiscountValue } from "./sidebar/DiscountList";
import { formatPeso } from "@/utils/formatPeso";

interface ViewAppliedDiscountModalProps {
  discountData: Discounts[];
  addDiscount: (data: Discounts) => void;
  selectedDiscounts: CreateSalesDiscount[] | null;
  removeDiscount: (data: Discounts) => void;
}

const ViewAppliedDiscountModal = ({
  discountData,
  addDiscount,
  selectedDiscounts,
  removeDiscount,
}: ViewAppliedDiscountModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<Discounts | null>(null);

  const handleSelect = (discount: Discounts) => {
    setSelected(discount);
    setIsOpen(false);
  };

  const handleAdd = () => {
    if (!selected) return;
    addDiscount(selected);
    setSelected(null);
  };

  const handleRemove = (discountId: number) => {
    const discount = discountData.find((d) => d.discountId === discountId);
    if (!discount) return;
    removeDiscount(discount);
  };

  const getDiscountMeta = (discountId: number) =>
    discountData.find((d) => d.discountId === discountId);

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Applied Discounts */}
      {selectedDiscounts && selectedDiscounts.length > 0 && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-600">
            Applied Discounts
          </label>

          <div className="flex flex-col gap-1 rounded border border-gray-200 p-2">
            {selectedDiscounts.map((sd, index) => {
              const meta = getDiscountMeta(sd.discountId);
              if (!meta) return null;

              return (
                <div
                  key={index}
                  className="flex items-center justify-between text-[9px] xl:text-xs"
                >
                  <span className="text-gray-700">
                    {meta.discountName}{" "}
                    <span className="text-gray-400">
                      (
                      {meta.discountType === "percent"
                        ? `${meta.discountValue}%`
                        : `₱${meta.discountValue}`}
                      )
                    </span>
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-red-600">
                      - {formatPeso(sd.discountAmount)}
                    </span>
                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() => handleRemove(sd.discountId)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Select Discount Dropdown */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-600">
          Select Discount
        </label>

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen((o) => !o)}
            className="w-full px-2 py-1 rounded border border-gray-300 text-left text-[9px] xl:text-xs bg-white"
          >
            {selected ? selected.discountName : "Select discount"}
          </button>

          {isOpen && (
            <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto">
              {discountData.length === 0 && (
                <div className="px-2 py-2 text-xs text-gray-400">
                  No discounts available
                </div>
              )}

              {discountData.map((dis) => (
                <button
                  key={dis.discountId}
                  type="button"
                  onClick={() => handleSelect(dis)}
                  className="w-full text-left px-2 py-1 text-[9px] xl:text-xs hover:bg-gray-100"
                >
                  {dis.discountName} ({" "}
                  {dis.discountType === "percent"
                    ? `${formatDiscountValue(Number(dis.discountValue))}%`
                    : `₱${dis.discountValue} off`}
                  )
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Discount Button */}
      <div className="flex mt-auto">
        <Button
          label="Add Discount"
          icon={Plus}
          size="sm"
          onClick={handleAdd}
          disabled={!selected}
        />
      </div>
    </div>
  );
};

export default ViewAppliedDiscountModal;
