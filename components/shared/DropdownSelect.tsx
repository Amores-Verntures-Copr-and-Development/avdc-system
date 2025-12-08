import React from "react";

interface Option {
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
  sizes,
  loading = false,
}) => {
  const sizeStyles = {
    xs: "h-8 text-xs px-2",
    sm: "h-8 text-sm px-3",
    md: "h-10 text-base px-3",
    lg: "h-12 text-lg px-4",
  }[sizes || "md"];
  const selectStyles = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  }[sizes || "md"];
  const labelClass = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  }[sizes || "md"];
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
  ${sizeStyles}
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
