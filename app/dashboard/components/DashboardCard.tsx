import { ArrowRight, LucideIcon } from "lucide-react";
import React, { ReactNode } from "react";

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
    <div className="flex flex-col justify-between p-4 border rounded-2xl shadow-sm border-gray-200 bg-white ">
      {/* Top Section */}
      <div className="flex items-center gap-3">
        <div
          className={`${bgColor} p-2 rounded-lg flex items-center justify-center`}
        >
          <Icon className="text-white w-5 h-5" />
        </div>
        <div className="flex flex-col align-middle items-start">
          <span className="block text-lg font-semibold text-gray-900">
            {value} {/* Use the passed value prop */}
          </span>
          <span className="text-sm text-gray-500">{title}</span>{" "}
          {/* Use the passed title prop */}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 my-3"></div>

      {/* Footer */}
      <div className="flex items-center justify-between text-gray-600 hover:text-gray-900 cursor-pointer">
        <span className="text-sm font-medium">View details</span>
        <ArrowRight size={15} />
      </div>
    </div>
  );
};

export default DashboardCard;
