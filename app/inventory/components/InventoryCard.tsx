import React from "react";

interface InventoryCardProps {
  title: string;
  subtitle?: string;
  value: number;
  icon?: React.ReactNode;
  iconBg?: string;
}
const InventoryCard: React.FC<InventoryCardProps> = ({
  title,
  value,
  icon,
  iconBg,
}) => {
  return (
    <div className="p-2 xl:p-4 bg-white shadow rounded">
      <div className="flex items-center gap-2 sm:gap-3">
        {icon && (
          <div
            className={`${iconBg} p-2 rounded-sm flex items-center justify-center`}
          >
            {icon}
          </div>
        )}
        <div>
          <p className="text-[8px] xl:text-sm text-gray-500">{title}</p>
          <p className="text-[8px] xl:text-xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default InventoryCard;
