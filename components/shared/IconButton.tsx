import React from "react";

interface IconButtonProps {
  icon?: React.ReactNode;
  onClick: () => void;
  label: string;
  bg: string;
}

const colorMap: Record<string, string> = {
  gray: "text-gray-600 hover:bg-gray-200",
  green: "text-green-600 hover:bg-green-200",
  red: "text-red-600 hover:bg-red-200",
  blue: "text-blue-600 hover:bg-blue-200",
  yellow: "text-yellow-600 hover:bg-yellow-200",
  primary: "text-primary-1 hover:primary-1-hover",
  nobg: "text-black hover:bg-gray-300",
};

const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onClick,
  label,
  bg,
}) => {
  return (
    <div className="relative group inline-block overflow-visible">
      <button
        onClick={onClick}
        className={`px-2 py-1 border-gray-300 border-1 rounded flex items-center gap-2 ${
          colorMap[bg] || ""
        }`}
      >
        {icon}
      </button>
      <span
        className={` absolute left-1/2 -translate-x-1/2 bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-800 text-white text-xs px-2 py-1 rounded pointer-events-none z-50`}
      >
        {label}
      </span>
    </div>
  );
};

export default IconButton;
