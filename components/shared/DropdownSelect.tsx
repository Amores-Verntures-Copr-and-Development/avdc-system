import React from "react";

export interface Option {
  label: string;
  value: string | number;
}

interface DropdownSelectProps {
  name: string;
  value: string | undefined;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: Option[];
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  sizes?: "xs" | "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
}

const DropdownSelect: React.FC<DropdownSelectProps> = ({
  disabled,
  name,
  value,
  onChange,
  options,
  label,
  placeholder,
  required = false,
  error,
  sizes = "md",
  loading = false,
}) => {
  const sizeClass = {
    xs: "h-8 xl:h-8 text-xs px-2",
    sm: "h-8 xl:h-8 text-xs xl:text-sm px-2",
    md: "h-8 xl:h-10 text-xs xl:text-base px-3",
    lg: "h-12 text-md md:text-lg px-4",
  }[sizes];
  const selectStyles = {
    xs: "text-[10px] xl:text-xs",
    sm: "text-md xl:text-sm",
    md: "text-md md:text-base",
    lg: "text-md md:text-lg",
  }[sizes || "md"];
  const labelClass = {
    xs: "text-[10px] xl:text-xs",
    sm: "text-[10px] lg:text-md xl:text-sm",
    md: "text-sm xl:text-md md:text-base",
    lg: "text-md md:text-lg",
  }[sizes];
  return (
    <div className="flex flex-1 flex-col gap-1 w-full">
      {label && (
        <label
          htmlFor={name}
          className={`${labelClass} font-semibold text-gray-700`}
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          disabled={disabled || loading}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          className={`w-full border ${selectStyles}  text-black border-gray-300 rounded-md py-1 pl-3  
  ${error ? "border-red-500" : "border-gray-300"} 
  ${sizeClass}
  disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-400`}
        >
          {placeholder && !loading && (
            <option value="" disabled hidden>
              {placeholder}
            </option>
          )}
          {loading ? (
            <option value="" disabled>
              Loading...
            </option>
          ) : (
            options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))
          )}
        </select>

        {/* Right-side content */}
      </div>

      {error && <span className="text-red-500 text-sm mt-1">{error}</span>}
    </div>
  );
};

export default DropdownSelect;
