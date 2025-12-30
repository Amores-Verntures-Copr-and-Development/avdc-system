import React, { useState } from "react";

interface DynamicInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  sizes?: "xs" | "sm" | "md" | "lg";
  allow?: boolean;
  leadingIcon?: React.ReactNode; // ✅ dynamic leading icon
}

const Input = React.forwardRef<HTMLInputElement, DynamicInputProps>(
  (
    {
      name,
      type = "text",
      label,
      placeholder,
      required = false,
      readOnly = false,
      error,
      sizes = "md",
      allow,
      defaultValue,
      leadingIcon,
      ...rest
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";

    const effectiveType = isPassword
      ? showPassword
        ? "text"
        : "password"
      : type;

    const showLabel = !placeholder;

    const labelClass = {
      xs: "text-[10px] xl:text-xs",
      sm: "text-md xl:text-sm",
      md: "text-md md:text-base",
      lg: "text-md md:text-lg",
    }[sizes];

    const sizeClass = {
      xs: "h-6 xl:h-8 text-xs px-2",
      sm: "h-6 xl:h-8 text-xs xl:text-sm px-2",
      md: "h-10 text-base px-3",
      lg: "h-12 text-md md:text-lg px-4",
    }[sizes];

    const leftPaddingWithIcon = leadingIcon ? "pl-9" : "";
    const rightPaddingWithToggle = isPassword ? "pr-9" : "";

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (
        [8, 9, 13, 27, 46].includes(e.keyCode) ||
        (e.ctrlKey && [65, 67, 86, 88].includes(e.keyCode)) ||
        (e.keyCode >= 35 && e.keyCode <= 39)
      ) {
        return;
      }
      if (!e.key.match(/^[a-zA-Z0-9\s]+$/)) {
        e.preventDefault();
      }
    };

    return (
      <div className="flex flex-1 flex-col gap-1 relative">
        {showLabel && (
          <label
            htmlFor={name}
            className={`${labelClass} font-semibold text-gray-700`}
          >
            {label}
          </label>
        )}

        <div className="relative">
          {/* ✅ Leading Icon */}
          {leadingIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {leadingIcon}
            </div>
          )}

          <input
            id={name}
            name={name}
            type={effectiveType}
            ref={ref}
            onKeyDown={!allow ? undefined : handleKeyDown}
            required={required}
            readOnly={readOnly}
            defaultValue={defaultValue}
            placeholder={placeholder || (showLabel ? "" : label)}
            className={`w-full border border-gray-300 text-black rounded-md
              focus:outline-none focus:ring-2
              ${
                readOnly
                  ? "bg-gray-100 cursor-not-allowed"
                  : "focus:ring-blue-400"
              }
              ${sizeClass}
              ${leftPaddingWithIcon}
              ${rightPaddingWithToggle}`}
            {...rest}
          />

          {/* 👁 Password Toggle */}
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              tabIndex={-1}
            >
              {showPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 3l18 18" />
                  <path d="M10.58 10.58a3 3 0 0 0 4.24 4.24" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M1.5 12s4-7 10.5-7 10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          )}
        </div>

        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
