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
      className={`border flex flex-col flex-1 overflow-vissible ${
        isRounded ? "rounded-2xl" : ""
      } shadow-sm border-gray-200 bg-white h-full p-2 2xl:p-2 
  ${
    isHover
      ? `hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-pointer`
      : ``
  }`}
      onClick={onClick}
    >
      <div className="">
        {" "}
        {/* Added margin to separate header */}
        <div className="flex flex-col">
          <div className="flex justify-between mb-2">
            <div className="flex flex-col justify-between">
              <h1 className="text-[9px] 2xl:text-sm font-semibold text-gray-900  flex items-center gap-2">
                {title}
              </h1>
              <span className="text-[8px] 2xl:text-xs text-gray-400">
                {subtitle}
              </span>
            </div>
            {leftTitle}
          </div>
        </div>
      </div>
      <div className="flex flex-col flex-1 min-h-0 overflow-visible">
        {children}
      </div>
    </div>
  );
};

export default BigCard;
