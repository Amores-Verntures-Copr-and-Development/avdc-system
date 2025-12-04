import React, { ReactNode } from "react";

interface BigCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  isRounded?: boolean;
  onClick?: () => void;
  leftTitle?: ReactNode;
  isHover?: boolean;
}

const BigCard = ({
  title,
  subtitle,
  children,
  isRounded = true,
  leftTitle,
  onClick,
  isHover = false,
}: BigCardProps) => {
  return (
    <div
      className={`border flex flex-col flex-1 overflow-hidden ${
        isRounded ? "rounded-2xl" : ""
      } shadow-sm border-gray-200 bg-white h-full p-4 
  ${
    isHover
      ? `hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-pointer`
      : ``
  }`}
      onClick={onClick}
    >
      <div className="mb-4">
        {" "}
        {/* Added margin to separate header */}
        <div className="flex flex-col">
          <div className="flex justify-between">
            <div className="flex flex-col justify-between">
              <h1 className="font-semibold">{title}</h1>
              <span className="text-xs text-gray-400">{subtitle}</span>
            </div>
            {leftTitle}
          </div>
        </div>
      </div>
      <div className="flex flex-col flex-1 min-h-0">{children}</div>
    </div>
  );
};

export default BigCard;
