import BigCard from "@/components/shared/BigCard";
import { StoreInterface } from "@/types/stores";
import { LocationEdit, MapIcon, Pin } from "lucide-react";
import React from "react";

interface StoreCardProps {
  data: StoreInterface;
  onClick: (data: StoreInterface) => void;
}

const StoreCard = ({ data, onClick }: StoreCardProps) => {
  return (
    <BigCard
      title={data.storeName}
      onClick={() => {
        onClick(data);
      }}
    >
      <div className="flex flex-col">
        <div className="flex">{data.storeDescription}</div>
        <div className="flex">
          <MapIcon />
          <span>{data.storeLocation}</span>
        </div>
      </div>
    </BigCard>
  );
};

export default StoreCard;
