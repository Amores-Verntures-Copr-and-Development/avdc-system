import React from "react";

interface VoucherStatCardProps {
  title: string;
  value: React.ReactNode;
  caption: string;
  icon: React.ReactNode;
  iconBg: string;
}

const VoucherStatCard = ({
  title,
  value,
  caption,
  icon,
  iconBg,
}: VoucherStatCardProps) => {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm 2xl:p-4">
      <div className="flex items-center gap-2">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl 2xl:h-10 2xl:w-10 ${iconBg}`}
        >
          {icon}
        </div>
        <p className="text-[10px] font-medium text-gray-500 2xl:text-xs">
          {title}
        </p>
      </div>

      <p className="mt-2 text-lg font-bold text-gray-900 2xl:text-2xl">
        {value}
      </p>
      <p className="mt-0.5 text-[10px] text-gray-400 2xl:text-xs">
        {caption}
      </p>
    </div>
  );
};

export default VoucherStatCard;
