import { ChevronDown } from "lucide-react";
import React, { useState, useEffect } from "react";

export interface DropdownOption {
  value: string | number;
  label: string;
}

interface DynamicDropdownProps {
  options: DropdownOption[];
  value?: string | number;
  defaultValue?: string | number;
  onChange: (value: string | number) => void;
  placeholder: string;
  icon: React.ReactNode;
  disabled?: boolean;
  size?: "xs" | "sm" | "md" | "lg"; // <-- match Button sizes
}

const sizeClasses: Record<"xs" | "sm" | "md" | "lg", string> = {
  xs: "text-[9px] md:text-xs px-2 py-1",
  sm: "text-[9px] md:text-xs lg:text-xs xl:text-xs px-1.5 py-1 xl:px-3 xl:py-1.5",
  md: "text-base px-4 py-2",
  lg: "text-lg px-5 py-2.5",
};

const DynamicDropdown = ({
  options,
  value,
  defaultValue,
  onChange,
  placeholder,
  icon,
  disabled = false,
  size = "md",
}: DynamicDropdownProps) => {
  const [open, setOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<string | number>("");

  // Determine selected option based on value or defaultValue
  const selectedOption =
    options.find((o) => o.value === value) ||
    options.find((o) => o.value === defaultValue);

  // Initialize selectedStore
  useEffect(() => {
    if (selectedOption) {
      setSelectedStore(selectedOption.label);
    }
  }, [selectedOption]);

  return (
    <div className="relative w-full">
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`
          flex items-center gap-2 rounded-md border border-gray-300 shadow-sm transition-colors duration-200 w-full
          ${sizeClasses[size]} 
          ${
            disabled
              ? "bg-gray-100 text-gray-600 cursor-not-allowed"
              : "bg-white hover:bg-gray-50"
          }
        `}
      >
        <div className="flex items-center gap-2 text-gray-700 flex-1">
          {!selectedOption && (
            <>
              <span className="text-gray-600">{icon}</span>
              <span className="truncate">
                {selectedStore ? selectedStore : placeholder}
              </span>
            </>
          )}

          {selectedOption && (
            <>
              <span className="text-gray-600">{icon}</span>
              <span className="truncate">{selectedOption.label}</span>
            </>
          )}
        </div>

        <ChevronDown className="w-4 h-4 text-gray-600" />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-md max-h-48 overflow-y-auto">
          {options.map((opt) => {
            const isSelected = opt.label === selectedStore;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  if (selectedStore === opt.label) {
                    onChange("");
                    setSelectedStore("");
                  } else {
                    onChange(opt.value);
                    setSelectedStore(opt.label);
                  }
                  setOpen(false);
                }}
                className={`w-full text-left text-black px-3 py-2 text-xs hover:bg-gray-100 transition-colors duration-150 ${
                  isSelected ? "bg-primary-1/20 font-semibold" : ""
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DynamicDropdown;
