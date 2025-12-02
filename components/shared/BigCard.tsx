import React, { ReactNode } from "react";

interface BigCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  isRounded?: boolean;
}

const BigCard = ({
  title,
  subtitle,
  children,
  isRounded = true,
}: BigCardProps) => {
  return (
    <div
      className={`border flex flex-col flex-1 overflow-hidden ${
        isRounded ? "rounded-2xl" : ""
      } shadow-sm border-gray-200 bg-white h-full p-4`}
    >
      <div className="mb-4">
        {" "}
        {/* Added margin to separate header */}
        <div className="flex flex-col">
          <h1 className="font-semibold">{title}</h1>
          <span className="text-xs text-gray-400">{subtitle}</span>
        </div>
      </div>
      <div className="flex flex-col flex-1 min-h-0">{children}</div>
    </div>
  );
};

export default BigCard;
