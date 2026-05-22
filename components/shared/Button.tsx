import React from "react";
import { Loader2, LucideIcon } from "lucide-react";

type ButtonSize = "xs" | "sm" | "md" | "lg";

type ButtonColor =
  | "primary"
  | "secondary"
  | "danger"
  | "success"
  | "tertiary"
  | "notselected"
  | "warning"
  | "neutral"
  | "outline";

export interface ButtonProps {
  isRounded?: boolean;
  label?: string;
  isAdaptive?: boolean;
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: LucideIcon;
  className?: string;
  size?: ButtonSize;
  color?: ButtonColor;
  isFocus?: boolean;
  hasBorder?: boolean;
}

const sizeClasses: Record<ButtonSize, string> = {
  xs: `
    text-[10px]
    px-2 py-1
  `,

  sm: `
    text-[10px]
    lg:text-xs
    px-2 py-1
    xl:px-3 xl:py-1.5
  `,

  md: `
    text-xs
    xl:text-sm
    2xl:text-base
    px-4 py-2
  `,

  lg: `
    text-base
    xl:text-lg
    px-5 py-2.5
  `,
};

const iconSizes: Record<ButtonSize, number> = {
  xs: 14,
  sm: 16,
  md: 18,
  lg: 22,
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
    base: `
      bg-[#c51d71]
      border border-[#c51d71]
      shadow-sm
    `,

    hover: `
      hover:bg-[#ad165f]
      hover:border-[#ad165f]
    `,

    focus: `
      focus:ring-4
      focus:ring-[#c51d71]/15
    `,

    text: "text-white",

    disabled: `
      bg-[#c51d71]/40
      border-[#c51d71]/40
      text-white/70
    `,
  },

  secondary: {
    base: `
      bg-white
      border border-gray-200
      shadow-sm
    `,

    hover: `
      hover:bg-gray-50
      hover:border-gray-300
    `,

    focus: `
      focus:ring-4
      focus:ring-gray-200/60
    `,

    text: "text-gray-700",

    disabled: `
      bg-gray-100
      border-gray-100
      text-gray-400
    `,
  },

  notselected: {
    base: `
      bg-white
      border border-[#c51d71]/20
      shadow-sm
    `,

    hover: `
      hover:bg-[#c51d71]/5
      hover:border-[#c51d71]/30
    `,

    focus: `
      focus:ring-4
      focus:ring-[#c51d71]/10
    `,

    text: "text-[#c51d71]",

    disabled: `
      bg-gray-50
      border-[#c51d71]/10
      text-[#c51d71]/40
    `,
  },

  danger: {
    base: `
      bg-rose-500
      border border-rose-500
      shadow-sm
    `,

    hover: `
      hover:bg-rose-600
      hover:border-rose-600
    `,

    focus: `
      focus:ring-4
      focus:ring-rose-500/15
    `,

    text: "text-white",

    disabled: `
      bg-rose-300
      border-rose-300
      text-white/70
    `,
  },

  success: {
    base: `
      bg-emerald-500
      border border-emerald-500
      shadow-sm
    `,

    hover: `
      hover:bg-emerald-600
      hover:border-emerald-600
    `,

    focus: `
      focus:ring-4
      focus:ring-emerald-500/15
    `,

    text: "text-white",

    disabled: `
      bg-emerald-400/80
      border-emerald-300
      text-black/60
    `,
  },

  warning: {
    base: `
      bg-amber-500
      border border-amber-500
      shadow-sm
    `,

    hover: `
      hover:bg-amber-600
      hover:border-amber-600
    `,

    focus: `
      focus:ring-4
      focus:ring-amber-500/15
    `,

    text: "text-white",

    disabled: `
      bg-amber-300
      border-amber-300
      text-white/70
    `,
  },

  tertiary: {
    base: `
      bg-indigo-500
      border border-indigo-500
      shadow-sm
    `,

    hover: `
      hover:bg-indigo-600
      hover:border-indigo-600
    `,

    focus: `
      focus:ring-4
      focus:ring-indigo-500/15
    `,

    text: "text-white",

    disabled: `
      bg-indigo-300
      border-indigo-300
      text-white/70
    `,
  },

  neutral: {
    base: `
      bg-gray-100
      border border-gray-200
      shadow-sm
    `,

    hover: `
      hover:bg-gray-200
    `,

    focus: `
      focus:ring-4
      focus:ring-gray-200/60
    `,

    text: "text-gray-700",

    disabled: `
      bg-gray-100
      border-gray-100
      text-gray-400
    `,
  },

  outline: {
    base: `
      bg-white
      border border-gray-200
      shadow-sm
    `,

    hover: `
      hover:bg-gray-50
      hover:border-gray-300
    `,

    focus: `
      focus:ring-4
      focus:ring-gray-200/60
    `,

    text: "text-gray-700",

    disabled: `
      bg-gray-50
      border-gray-100
      text-gray-400
    `,
  },
};

const Button: React.FC<ButtonProps> = ({
  label,
  onClick,
  loading = false,
  disabled = false,
  className = "",
  size = "md",
  color = "primary",
  icon: Icon,
  isFocus = false,
  isRounded = true,
}) => {
  const isDisabled = loading || disabled;

  const colors = colorClasses[color];

  const iconSize = iconSizes[size];

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();

        if (!isDisabled && onClick) {
          onClick();
        }
      }}
      disabled={isDisabled}
      className={`
        relative flex w-full items-center justify-center gap-2
        
        ${isRounded ? "rounded-xl" : ""}
        
        transition-all duration-200 ease-out
        
        active:scale-[0.98]
        
        ${sizeClasses[size]}
        
        ${
          isDisabled
            ? `${colors.disabled} cursor-not-allowed`
            : `
              ${colors.base}
              ${colors.hover}
              ${colors.text}
            `
        }

        ${isFocus ? colors.focus : ""}
        
        ${
          !className?.match(
            /\bfont-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)\b/,
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
            <Loader2 size={iconSize} className="animate-spin" />
          </span>

          <span className="invisible flex items-center gap-2">
            {Icon && <Icon size={iconSize} />}

            {label && <span>{label}</span>}
          </span>
        </>
      ) : (
        <>
          {Icon && <Icon size={iconSize} className="shrink-0" />}

          {label && <span className="truncate">{label}</span>}
        </>
      )}
    </button>
  );
};

export default Button;
