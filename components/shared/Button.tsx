import React from "react";
import { Loader2 } from "lucide-react";

// Define types for better type safety
type ButtonSize = "xs" | "sm" | "md" | "lg";
type ButtonColor =
  | "primary"
  | "secondary"
  | "danger"
  | "success"
  | "tertiary"
  | "notselected"
  | "nocolor";

interface ButtonProps {
  isRounded?: boolean;
  label?: string;
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
  size?: ButtonSize;
  color?: ButtonColor;
  isFocus?: boolean;
}

const sizeClasses: Record<ButtonSize, string> = {
  xs: "text-xs px-2 py-1",
  sm: "text-xs sm:text-sm px-1.5 py-1 sm:px-3 sm:py-1.5 ",
  md: "text-base px-4 py-2",
  lg: "text-lg px-5 py-2.5",
};

const colorClasses: Record<
  ButtonColor,
  {
    base: string;
    hover: string;
    focus: string;
    text: string;
    disabled: string;
  }
> = {
  primary: {
    base: "bg-primary-1 border border-primary-1/70",
    hover: "hover:bg-primary-1-hover",
    focus: "focus:ring-2 focus:ring-primary-1 focus:ring-offset-2",
    text: "text-white",
    disabled: "bg-primary-1/50 text-white/70",
  },
  nocolor: {
    base: "bg-white border border-gray-200",
    hover: "hover:bg-gray-300",
    focus: "focus:ring-2 focus:ring-primary-1 focus:ring-offset-2",
    text: "text-black",
    disabled: "bg-primary-1/50 text-white/70",
  },
  secondary: {
    base: "bg-gray-200 border border-gray-300",
    hover: "hover:bg-gray-300",
    focus: "focus:ring-2 focus:ring-gray-600 focus:ring-offset-2",
    text: "text-black",
    disabled: "bg-gray-400 text-gray-100",
  },
  danger: {
    base: "bg-red-600 border border-red-300",
    hover: "hover:bg-red-700",
    focus: "focus:ring-2 focus:ring-red-500 focus:ring-offset-2",
    text: "text-white",
    disabled: "bg-red-400 text-white/70",
  },
  success: {
    base: "bg-green-800 border border-green-900",
    hover: "hover:bg-green-700",
    focus: "focus:ring-2 focus:ring-green-500 focus:ring-offset-2",
    text: "text-white",
    disabled:
      "bg-green-200 text-green-700 cursor-pointer border border-green-300 ",
  },
  // primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 shadow-sm",
  tertiary: {
    base: "bg-blue-800 shadow-sm border border-blue",
    hover: "hover:bg-blue-700",
    focus: "focus:ring-2 focus:ring-blue-700 focus:ring-offset-2",
    text: "text-white",
    disabled: "bg-blue-400 text-white/70",
  },
  notselected: {
    base: "bg-gray-200 shadow-sm",
    hover: "hover:bg-gray-700 hover:text-white",
    focus: "focus:ring-2 focus:ring-blue-700 focus:ring-offset-2",
    text: "text-black",
    disabled: "bg-blue-400 text-black/70",
  },
};

const Button: React.FC<ButtonProps> = ({
  label = "Add",
  onClick,
  loading = false,
  disabled = false,
  className = "",
  size = "md",
  color = "primary",
  icon,
  isFocus = false,
  isRounded = true,
}) => {
  const isDisabled = loading || disabled;
  const colors = colorClasses[color];

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`
        relative w-full flex items-center justify-center gap-2 ${
          isRounded && "rounded-md"
        }
         transition-all duration-200 ease-in-out 
        ${sizeClasses[size]}
        ${
          isDisabled
            ? `${colors.disabled} cursor-not-allowed`
            : `${colors.base} ${colors.hover} ${colors.text}`
        }
        ${isFocus && colors.focus}
      
        ${
          !className?.match(
            /\bfont-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)\b/
          )
            ? "font-medium"
            : ""
        }
        ${className}
      `}
    >
      {loading ? (
        <>
          <span className="absolute inset-0 flex items-center justify-center">
            <Loader2 size={18} className="animate-spin" />
          </span>
          <span className="invisible flex items-center gap-2">
            {icon && <span>{icon}</span>}
            {label}
          </span>
        </>
      ) : (
        <>
          {icon && <span>{icon}</span>}
          {label}
        </>
      )}
    </button>
  );
};

export default Button;
