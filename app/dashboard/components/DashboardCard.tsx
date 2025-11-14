import { ArrowRight, LucideIcon } from "lucide-react";
import React from "react";

interface DashboardCardProps {
  title: string;
  icon: LucideIcon;
  value: number;
  bgColor?: string;
}

const DashboardCard = ({
  title,
  icon: Icon,
  value,
  bgColor = "bg-emerald-600",
}: DashboardCardProps) => {
  return (
    <div className="flex flex-col justify-between p-4 sm:p-5 border rounded-2xl shadow-sm border-gray-200 bg-white hover:shadow-md transition-shadow duration-300">
      {/* Top Section */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div
          className={`${bgColor} p-2 sm:p-3 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0`}
        >
          <Icon className="text-white w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
        </div>
        <div className="flex flex-col items-start min-w-0 flex-1">
          <span className="block text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 truncate w-full">
            {value}
          </span>
          <span className="text-sm sm:text-base text-gray-500 truncate w-full">
            {title}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 my-3 sm:my-4"></div>

      {/* Footer */}
      <div className="flex items-center justify-between text-gray-600 hover:text-gray-900 cursor-pointer group">
        <span className="text-sm sm:text-base font-medium">View details</span>
        <ArrowRight
          size={15}
          className="sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform duration-200"
        />
      </div>
    </div>
  );
};

export default DashboardCard;
