import { LucideIcon } from "lucide-react";
import React from "react";
interface SalesCardProps {
  icon: LucideIcon;
  title: string;
  value: string;
  textColor?: string;
  bgColor?: string;
  children?: React.ReactNode;
}
const SalesCard = ({
  icon: Icon,
  title,
  value = "0",
  textColor = "text-primary-1",
  bgColor = "bg-primary-1/20",
  children,
}: SalesCardProps) => {
  return (
    <div className="flex flex-row justify-between 2xl:flex-col  flex-1  gap-1 2xl:gap-4  bg-white p-2 2xl:p-2 shadow-sm">
      <div className="flex flex-row gap-5 items-center ">
        {" "}
        <div
          className={`${bgColor} flex h-5 w-5 2xl:h-10 2xl:w-10 items-center justify-center rounded-md`}
        >
          <Icon className={`h-3 w-3 2xl:h-5 2xl:w-5 ${textColor}`} />
        </div>
        <div className="flex flex-col items-center flex-1">
          <span className="text-[9px] lg:text-[10px] 2xl:text-sm font-medium text-gray-500">
            {title}
          </span>
          <span className="text-[10px] lg:text-xs 2xl:text-lg font-semibold text-gray-900">
            {value}
          </span>
        </div>
      </div>
      {children}
    </div>
  );
};

export default SalesCard;
