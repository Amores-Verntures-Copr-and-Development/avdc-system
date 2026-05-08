import { LucideIcon } from "lucide-react";
import React from "react";

interface SalesCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  subtitle?: string;
  textColor?: string;
  bgColor?: string;
  children?: React.ReactNode;
}

const SalesCard = ({
  icon: Icon,
  title,
  value = "0",
  subtitle,
  textColor = "text-primary-1",
  bgColor = "bg-primary-1/10",
  children,
}: SalesCardProps) => {
  return (
    <div className="group rounded-2xl border border-gray-100 bg-white p-2 2xl:p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start gap-2 2xl:gap-4">
        <div
          className={`flex h-6 w-6 2xl:h-12 2xl:w-12 shrink-0 items-center justify-center rounded-2xl ${bgColor}`}
        >
          <Icon className={`2-3 h-3 2xl:h-6  2xl:w-6 ${textColor}`} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] 2xl:text-sm font-medium text-gray-500">
            {title}
          </p>
          <h3 className="mt-1 truncate text-xs 2xl:text-2xl font-bold text-gray-900">
            {value}
          </h3>

          {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
        </div>
      </div>

      {children && <div className="mt-5">{children}</div>}
    </div>
  );
};

export default SalesCard;
