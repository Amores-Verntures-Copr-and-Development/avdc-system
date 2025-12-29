import Button from "@/components/shared/Button";
import { Discounts } from "@/types/discount";
import { Plus } from "lucide-react";
import React, { useState } from "react";
import { formatDiscountValue } from "./sidebar/DiscountList";
import { formatPeso } from "@/utils/formatPeso";

interface ViewAppliedDiscountModalProps {
  discountData: Discounts[];
}
const ViewAppliedDiscountModal = ({
  discountData,
}: ViewAppliedDiscountModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="flex flex-col">
      <div className="flex flex-col">
        <label>Select Discount</label>
        <button
          type="button"
          onClick={() => setIsOpen((o) => !o)}
          className={`w-full px-2 py-1 rounded border border-gray-300 text-left text-[9px] xl:text-xs
`}
        >
          {"Select"}
        </button>
        {isOpen && (
          <div className="z-50 mt-1 w-full bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto">
            {" "}
            {discountData.map((dis) => (
              <button
                key={dis.discountId}
                type="button"
                className="w-full text-left px-2 py-1 text-[9px] xl:text-xs hover:bg-gray-100"
              >
                {dis.discountName}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex mt-auto">
        <Button
          label="Add Discount"
          icon={<Plus className="w-4 h-4" />}
          size="sm"
        />
      </div>
    </div>
  );
};

export default ViewAppliedDiscountModal;

