import BigCard from "@/components/shared/BigCard";
import { StoreInterface } from "@/types/stores";
import { LocationEdit, MailIcon, MapIcon, PhoneIcon, Pin } from "lucide-react";
import React from "react";

interface StoreCardProps {
  data: StoreInterface;
  onClick: (data: StoreInterface) => void;
}

const StoreCard = ({ data, onClick }: StoreCardProps) => {
  return (
    <BigCard
      isHover={true}
      title={data.storeName}
      onClick={() => {
        onClick(data);
      }}
    >
      <div className="flex flex-col gap-3">
        {data.storeDescription && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {data.storeDescription}
          </p>
        )}

        <div className="flex flex-col gap-2 text-sm">
          {data.storeLocation && (
            <div className="flex items-center gap-2 text-gray-700">
              <MapIcon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{data.storeLocation}</span>
            </div>
          )}

          {data.storeContactPhone && (
            <div className="flex items-center gap-2 text-gray-700">
              <PhoneIcon className="w-4 h-4 flex-shrink-0" />
              <span>{data.storeContactPhone}</span>
            </div>
          )}

          {data.storeEmail && (
            <div className="flex items-center gap-2 text-gray-700">
              <MailIcon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{data.storeEmail}</span>
            </div>
          )}
        </div>
      </div>
    </BigCard>
  );
};

export default StoreCard;
