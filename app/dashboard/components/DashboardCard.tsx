import { ArrowRight, LucideIcon } from "lucide-react";
import React from "react";

interface DashboardCardProps {
  title: string;
  icon: LucideIcon;
  value: string | number;
  bgColor?: string;
  trend?: string;
  trendType?: "up" | "down";
  trendLabel?: string;
  onClick?: () => void;
}

const DashboardCard = ({
  title,
  icon: Icon,
  value,
  bgColor = "bg-primary-1",
  trend,
  trendType = "up",
  trendLabel = "vs last 30 days",
  onClick,
}: DashboardCardProps) => {
  return (
    <div
      onClick={onClick}
      className={`group flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bgColor} shadow-sm`}
      >
        <Icon className="h-5 w-5 text-white" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-gray-500">{title}</p>

        <h3 className="truncate text-lg font-bold text-gray-900 xl:text-xl">
          {value}
        </h3>

        {trend && (
          <p
            className={`truncate text-[11px] font-medium ${
              trendType === "up" ? "text-emerald-500" : "text-rose-500"
            }`}
          >
            {trendType === "up" ? "↑" : "↓"} {trend}
            <span className="ml-1 font-normal text-gray-400">
              {trendLabel}
            </span>
          </p>
        )}
      </div>

      {onClick && (
        <ArrowRight className="h-4 w-4 shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-400" />
      )}
    </div>
  );
};

export default DashboardCard;
