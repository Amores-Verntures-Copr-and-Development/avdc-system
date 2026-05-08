import { ArrowRight, LucideIcon } from "lucide-react";
import React from "react";

interface DashboardCardProps {
  title: string;
  icon: LucideIcon;
  value: string | number;
  bgColor?: string;
  textColor?: string;
  trend?: string;
  trendType?: "up" | "down";
  onClick?: () => void;
}

const DashboardCard = ({
  title,
  icon: Icon,
  value,
  bgColor = "bg-primary-1",
  textColor = "text-primary-1",
  trend,
  trendType = "up",
  onClick,
}: DashboardCardProps) => {
  return (
    <div className="group rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md xl:p-5">
      <div className="flex items-start gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${bgColor} shadow-sm`}
        >
          <Icon className="h-6 w-6 text-white" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-gray-500 xl:text-sm">
            {title}
          </p>

          <h3 className="mt-1 truncate text-xl font-bold text-gray-900 xl:text-2xl">
            {value}
          </h3>

          {trend && (
            <p
              className={`mt-1 text-xs font-medium ${
                trendType === "up" ? "text-emerald-500" : "text-rose-500"
              }`}
            >
              {trendType === "up" ? "↑" : "↓"} {trend}
              <span className="ml-1 font-normal text-gray-400">
                vs last 30 days
              </span>
            </p>
          )}
        </div>
      </div>

      <div className="my-4 border-t border-gray-100" />

      <button
        type="button"
        onClick={onClick}
        className={`flex w-full items-center justify-between text-xs font-semibold ${textColor}`}
      >
        <span>View details</span>
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </button>
    </div>
  );
};

export default DashboardCard;
