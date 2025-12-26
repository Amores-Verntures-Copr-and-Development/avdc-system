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
  | "secondary"
  | "warning"
  | "neutral";

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
  hasBorder?: boolean;
}

const sizeClasses: Record<ButtonSize, string> = {
  xs: "text-[9px] md:text-xs px-2 py-1",
  sm: "text-[9px] md:text-xs lg:text-xs xl:text-xs px-1.5 py-1 xl:px-3 xl:py-1.5 ",
  md: "text-base px-4 py-2",
  lg: "text-lg px-5 py-2.5",
};

const colorClasses: Record<
  ButtonColor,
  {
    base: string;
    border: string;
    hover: string;
    focus: string;
    text: string;
    disabled: string;
  }
> = {
  primary: {
    base: "bg-[#c51d71] border border-[#c51d71] shadow-md",
    border: "border-b-2 border-b-[#930160]",
    hover: "hover:bg-[#a91860] hover:border-[#a91860]",
    focus: "focus:ring-2 focus:ring-[#c51d71]/40 focus:ring-offset-2",
    text: "text-white",
    disabled: "bg-[#c51d71]/30 text-white/60 shadow-none",
  },

  secondary: {
    base: "bg-slate-100 border border-slate-200",
    border: "border-b-2 border-b-slate-400",
    hover: "hover:bg-slate-200 hover:border-slate-300",
    focus: "focus:ring-2 focus:ring-slate-300/50 focus:ring-offset-2",
    text: "text-slate-700",
    disabled: "bg-slate-50 border-slate-100 text-slate-400 shadow-none",
  },

  notselected: {
    base: "bg-white border border-[#c51d71] border-b-2 border-b-[#a91860]",
    border: "border-b-2 border-b-[#a91860]",
    hover: "hover:bg-[#c51d71]/8 hover:border-[#a91860]",
    focus: "focus:ring-2 focus:ring-[#c51d71]/30 focus:ring-offset-2",
    text: "text-[#c51d71]",
    disabled:
      "bg-gray-50 border-[#c51d71]/25 text-[#c51d71]/40 shadow-none border-b-[#c51d71]/40",
  },

  danger: {
    base: "bg-rose-500 border border-rose-500 ",
    border: " border-b-2 border-b-rose-600",
    hover: "hover:bg-rose-600 hover:border-rose-600",
    focus: "focus:ring-2 focus:ring-rose-500/40 focus:ring-offset-2",
    text: "text-white",
    disabled:
      "bg-rose-300 border-rose-300 text-white/60 shadow-none border-b-rose-400",
  },

  success: {
    base: "bg-emerald-600 border border-emerald-700 ",
    border: "border-b-2 border-b-emerald-800",
    hover: "hover:bg-emerald-600 hover:border-emerald-600",
    focus: "focus:ring-2 focus:ring-emerald-500/40 focus:ring-offset-2",
    text: "text-white",
    disabled: "bg-emerald-300 text-black/50 ",
  },

  warning: {
    base: "bg-amber-600 border border-amber-600 ",
    border: " border-b-2 border-b-amber-700",
    hover: "hover:bg-amber-600 hover:border-amber-600",
    focus: "focus:ring-2 focus:ring-amber-500/40 focus:ring-offset-2",
    text: "text-white",
    disabled:
      "bg-amber-300 border-amber-300 text-white/60 shadow-none border-b-amber-400",
  },

  tertiary: {
    base: "bg-indigo-500   border border-indigo-600 ",
    border: "border-b-2 border-b-indigo-800",
    hover: "hover:bg-indigo-700 hover:border-indigo-700",
    focus: "focus:ring-2 focus:ring-indigo-600/40 focus:ring-offset-2",
    text: "text-white",
    disabled:
      "bg-indigo-300 border-indigo-300 text-white/60 shadow-none border-b-indigo-400",
  },

  neutral: {
    base: "bg-gray-200 border border-gray-300",
    border: "border-b-2 border-b-gray-400",
    hover: "hover:bg-[#c51d71]/8",
    focus: "focus:ring-2 focus:ring-[#c51d71]/25 focus:ring-offset-2",
    text: "text-slate-700",
    disabled: "text-slate-400 shadow-none border-b-gray-300",
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
  hasBorder = false,
}) => {
  const isDisabled = loading || disabled;
  const colors = colorClasses[color];

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) {
          onClick();
        }
      }}
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
            : `${colors.base} ${colors.hover} ${colors.text} ${hasBorder}  ${
                hasBorder ? colors.border : ""
              }  `
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
            <span className="hidden sm:inline">{label}</span>
          </span>
        </>
      ) : (
        <>
          {icon && <span>{icon}</span>}
          <span className="inline">{label}</span>
        </>
      )}
    </button>
  );
};

export default Button;
