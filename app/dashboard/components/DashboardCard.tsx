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
    <div className="flex flex-col justify-between p-3 xs:p-4 sm:p-5 border rounded-xl sm:rounded-2xl shadow-sm border-gray-200 bg-white hover:shadow-md transition-all duration-300 hover:scale-[1.02]">
      {/* Top Section */}
      <div className="flex flex-col sm:flex-row items-center gap-2 xs:gap-3 sm:gap-4">
        <div
          className={`${bgColor} p-1.5 xs:p-2.5 sm:p-3 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0`}
        >
          <Icon className="text-white w-3 h-3 xs:w-5 xs:h-5 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7" />
        </div>
        <div className="flex flex-col items-start min-w-0 flex-1">
          <span className="block text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 truncate w-full">
            {value.toLocaleString()}
          </span>
          <span className="text-xs xs:text-sm sm:text-xs md:text-sm lg:text-base text-gray-500 truncate w-full mt-0.5 xs:mt-1">
            {title}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 my-2 xs:my-3 sm:my-4"></div>

      {/* Footer */}
      <div className="flex items-center justify-between text-gray-600 hover:text-gray-900 cursor-pointer group">
        <span className="text-xs xs:text-sm sm:text-xs md:text-sm lg:text-sm font-medium truncate">
          View details
        </span>
        <ArrowRight className="w-3 h-3 xs:w-4 xs:h-4 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform duration-200" />
      </div>
    </div>
  );
};

export default DashboardCard;
