import { SupplierItemPrices } from "@/types/supplier";
import { formatDateToWords } from "@/utils/formatDateToWords";
import { formatPeso } from "@/utils/formatPeso";

import React from "react";

interface PriceUpdateCardProps {
  data: SupplierItemPrices;
  index: number;
}

const PriceUpdateCard = ({ data, index }: PriceUpdateCardProps) => {
  return (
    <div
      key={data.sipId}
      className="bg-white flex items-center justify-between border-t border-b border-gray-200 rounded p-1 hover:border-blue-300 transition-colors w-full"
    >
      <span className="text-xs">#{index + 1}</span>
      <div className="text-sm">{formatPeso(data.sipAmount)}</div>
      <div className="text-xs flex flex-col">
        <span> {formatDateToWords(data.sipCreatedAt)}</span>
      </div>
    </div>
  );
};

export default PriceUpdateCard;
