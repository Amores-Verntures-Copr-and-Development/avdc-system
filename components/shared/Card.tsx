import React from "react";

interface CardProps {
  title: string;
  value: number;
  icon?: React.ReactNode;
  iconBg?: string;
}
const Card: React.FC<CardProps> = ({ title, value, icon, iconBg }) => {
  return (
    <div className="p-2 xl:p-4 bg-white shadow rounded">
      <div className="flex items-center gap-3">
        {icon && (
          <div
            className={`${iconBg} p-2 rounded-sm flex items-center justify-center`}
          >
            {icon}
          </div>
        )}
        <div>
          <p className="text-xs xl:text-sm text-gray-500">{title}</p>
          <p className="text-sm xl:text-xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default Card;
