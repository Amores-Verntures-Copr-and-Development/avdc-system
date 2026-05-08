import { ChevronDown } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export interface DropdownOption {
  value: string | number;
  label: string;
}

interface DynamicDropdownProps {
  options: DropdownOption[];
  value?: string | number;
  defaultValue?: string | number;
  onChange: (value: string | number | "") => void;
  placeholder: string;
  icon: React.ReactNode;
  disabled?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
}

const sizeClasses: Record<"xs" | "sm" | "md" | "lg", string> = {
  xs: "text-[10px] px-2 py-1",
  sm: "text-xs px-2.5 py-1.5",
  md: "text-sm px-3 py-2",
  lg: "text-base px-4 py-2.5",
};

const DynamicDropdown = ({
  options,
  value,
  defaultValue,
  onChange,
  placeholder,
  icon,
  disabled = false,
  size = "sm",
}: DynamicDropdownProps) => {
  const [open, setOpen] = useState(false);

  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption =
    options.find((o) => o.value === value) ||
    options.find((o) => o.value === defaultValue);

  const updatePosition = () => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();

    setPosition({
      top: rect.bottom + 8,
      left: rect.left,
      width: rect.width,
    });
  };

  const toggleDropdown = () => {
    if (disabled) return;

    updatePosition();
    setOpen((prev) => !prev);
  };

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        triggerRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) {
        return;
      }

      setOpen(false);
    };

    const handleUpdatePosition = () => {
      updatePosition();
    };

    document.addEventListener("mousedown", handleClickOutside);

    window.addEventListener("resize", handleUpdatePosition);

    window.addEventListener("scroll", handleUpdatePosition, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);

      window.removeEventListener("resize", handleUpdatePosition);

      window.removeEventListener("scroll", handleUpdatePosition, true);
    };
  }, [open]);

  return (
    <>
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={toggleDropdown}
        className={`
          flex w-full items-center justify-between gap-2
          rounded-xl border
          transition-all duration-200
          ${sizeClasses[size]}
          
          ${
            disabled
              ? "cursor-not-allowed border-gray-100 bg-gray-100 text-gray-400"
              : `
                border-gray-200
                bg-white
                text-gray-700
                hover:border-gray-300
                hover:bg-gray-50
                active:scale-[0.99]
              `
          }

          ${open ? "border-gray-300 bg-gray-50" : ""}
        `}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="shrink-0 text-gray-400">{icon}</span>

          <span className="truncate text-left font-medium">
            {selectedOption?.label || placeholder}
          </span>
        </div>

        <ChevronDown
          className={`
            h-4 w-4 shrink-0 text-gray-400 transition-transform
            ${open ? "rotate-180" : ""}
          `}
        />
      </button>

      {/* Dropdown */}
      {open &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "fixed",
              top: position.top,
              left: position.left,
              width: position.width,
              zIndex: 9999,
            }}
            className="
              overflow-hidden rounded-2xl
              border border-gray-100
              bg-white/95
              shadow-2xl
              backdrop-blur-sm
            "
          >
            <div className="no-scrollbar max-h-64 overflow-y-auto p-1">
              {options.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-gray-400">
                  No options available
                </div>
              ) : (
                options.map((opt) => {
                  const isSelected =
                    String(opt.value) === String(selectedOption?.value);

                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          onChange("");
                        } else {
                          onChange(opt.value);
                        }

                        setOpen(false);
                      }}
                      className={`
                        flex w-full items-center rounded-xl px-3 py-2
                        text-left text-xs transition-all
                        
                        ${
                          isSelected
                            ? `
                              bg-gray-100
                              font-medium
                              text-gray-900
                            `
                            : `
                              text-gray-600
                              hover:bg-gray-50
                            `
                        }
                      `}
                    >
                      <span className="truncate">{opt.label}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

export default DynamicDropdown;
