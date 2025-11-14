import React, { ReactNode } from "react";

interface BigCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

const BigCard = ({ title, subtitle, children }: BigCardProps) => {
  return (
    <div className="border flex flex-col flex-1 rounded-2xl shadow-sm border-gray-200 bg-white h-full p-4">
      <div className="mb-4">
        {" "}
        {/* Added margin to separate header */}
        <div className="flex flex-col">
          <h1 className="font-semibold">{title}</h1>
          <span className="text-xs text-gray-400">{subtitle}</span>
        </div>
      </div>
      <div className="flex flex-col flex-1">{children}</div>
    </div>
  );
};

export default BigCard;
