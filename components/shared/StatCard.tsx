import { ArrowDownRight, ArrowUpRight, LucideIcon } from "lucide-react";
import React from "react";
import Sparkline from "./Sparkline";

interface StatCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  subtitle?: string;
  textColor?: string;
  bgColor?: string;
  children?: React.ReactNode;
  headerRight?: React.ReactNode;
  trend?: { period: string; value: number }[];
  trendColor?: string;
  growthPct?: number;
  growthLabel?: string;
}

const StatCard = ({
  icon: Icon,
  title,
  value = "0",
  subtitle,
  textColor = "text-primary-1",
  bgColor = "bg-primary-1/10",
  children,
  headerRight,
  trend,
  trendColor = "#16a34a",
  growthPct,
  growthLabel = "vs last month",
}: StatCardProps) => {
  const isPositiveGrowth = (growthPct ?? 0) >= 0;

  return (
    <div className="group rounded-2xl border border-gray-100 bg-white p-2 2xl:p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-start gap-2 2xl:gap-4">
          <div
            className={`flex h-6 w-6 2xl:h-10 2xl:w-10 shrink-0 items-center justify-center rounded-2xl ${bgColor}`}
          >
            <Icon className={`2-3 h-3 2xl:h-5  2xl:w-5 ${textColor}`} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] 2xl:text-xs font-medium text-gray-500">
              {title}
            </p>
            <h3 className="mt-1 truncate text-xs 2xl:text-lg font-bold text-gray-900">
              {value}
            </h3>

            {subtitle && (
              <p className="mt-1 text-[9px]  2xl:text-[10px] text-gray-400">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {headerRight && <div className="shrink-0">{headerRight}</div>}
      </div>

      {children && <div className="mt-5">{children}</div>}

      {trend && (
        <div className="mt-2">
          <Sparkline data={trend} color={trendColor} />

          {typeof growthPct === "number" && (
            <div
              className={`mt-1 flex items-center gap-1 text-[9px] 2xl:text-[11px] font-medium ${
                isPositiveGrowth ? "text-emerald-600" : "text-red-500"
              }`}
            >
              {isPositiveGrowth ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              <span>
                {Math.abs(growthPct).toFixed(1)}% {growthLabel}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StatCard;
