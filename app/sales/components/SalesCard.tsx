import { LucideIcon } from "lucide-react";
import React from "react";
interface SalesCardProps {
  icon: LucideIcon;
  title: string;
  value: string;
  textColor?: string;
  bgColor?: string;
}
const SalesCard = ({
  icon: Icon,
  title,
  value = "0",
  textColor = "text-primary-1",
  bgColor = "bg-primary-1/20",
}: SalesCardProps) => {
  return (
    <div className="flex w-full items-center gap-2 2xl:gap-4  bg-white p-2 2xl:p-4 shadow-sm">
      <div
        className={`${bgColor} flex h-5 w-5 2xl:h-10 2xl:w-10 items-center justify-center rounded-md`}
      >
        <Icon className={`h-3 w-3 2xl:h-5 2xl:w-5 ${textColor}`} />
      </div>

      <div className="flex flex-col">
        <span className="text-xs 2xl:text-sm font-medium text-gray-500">
          {title}
        </span>
        <span className="text-sm 2xl:text-lg font-semibold text-gray-900">
          {value}
        </span>
      </div>
    </div>
  );
};

export default SalesCard;
