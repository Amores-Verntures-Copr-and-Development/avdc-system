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
  subtitle,
  value,
  icon,
  iconBg,
}) => {
  return (
    <div className="p-4 bg-white shadow rounded">
      <div className="flex items-center gap-3">
        {icon && (
          <div
            className={`${iconBg} p-2 rounded-sm flex items-center justify-center`}
          >
            {icon}
          </div>
        )}
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default InventoryCard;
