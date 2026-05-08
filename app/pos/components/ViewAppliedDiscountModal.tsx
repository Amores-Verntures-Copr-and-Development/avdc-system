import Button from "@/components/shared/Button";
import { Discounts } from "@/types/discount";
import { Plus, Trash2, ChevronDown } from "lucide-react";
import React, { useMemo, useState } from "react";
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

  const discountMap = useMemo(() => {
    return new Map(discountData.map((d) => [d.discountId, d]));
  }, [discountData]);

  const handleAdd = () => {
    if (!selected) return;

    addDiscount(selected);
    setSelected(null);
  };

  const handleRemove = (discountId: number) => {
    const discount = discountMap.get(discountId);
    if (!discount) return;

    removeDiscount(discount);
  };

  return (
    <div className="flex h-full flex-col gap-5">
      {/* Applied Discounts */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-gray-800">
            Applied Discounts
          </label>

          {selectedDiscounts && selectedDiscounts.length > 0 && (
            <span className="text-xs text-gray-400">
              {selectedDiscounts.length} applied
            </span>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-3">
          {!selectedDiscounts || selectedDiscounts.length === 0 ? (
            <div className="flex items-center justify-center py-6 text-sm text-gray-400">
              No discounts applied yet
            </div>
          ) : (
            <div className="space-y-2">
              {selectedDiscounts.map((sd, index) => {
                const meta = discountMap.get(sd.discountId);

                if (!meta) return null;

                return (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-800">
                        {meta.discountName}
                      </span>

                      <span className="text-xs text-gray-400">
                        {meta.discountType === "percent"
                          ? `${meta.discountValue}% off`
                          : `₱${meta.discountValue} off`}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-rose-500">
                        -{formatPeso(sd.discountAmount)}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemove(sd.discountId)}
                        className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Select Discount */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-800">
          Select Discount
        </label>

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm transition hover:border-gray-300 hover:shadow-md"
          >
            <span className={selected ? "text-gray-800" : "text-gray-400"}>
              {selected ? selected.discountName : "Choose a discount"}
            </span>

            <ChevronDown
              className={`h-4 w-4 text-gray-400 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isOpen && (
            <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
              {discountData.length === 0 ? (
                <div className="px-4 py-4 text-sm text-gray-400">
                  No discounts available
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto">
                  {discountData.map((dis) => (
                    <button
                      key={dis.discountId}
                      type="button"
                      onClick={() => {
                        setSelected(dis);
                        setIsOpen(false);
                      }}
                      className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-gray-50"
                    >
                      <span className="text-sm text-gray-700">
                        {dis.discountName}
                      </span>

                      <span className="text-xs font-medium text-gray-400">
                        {dis.discountType === "percent"
                          ? `${formatDiscountValue(Number(dis.discountValue))}%`
                          : `₱${dis.discountValue} off`}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto pt-2">
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
