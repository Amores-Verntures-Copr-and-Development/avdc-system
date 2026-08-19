import React, { useEffect, useState } from "react";

type ToggleProps = {
  label?: string;
  initial?: boolean;
  onToggle?: (state: boolean) => void;
  sizes?: "xs" | "sm" | "md" | "lg";
  flexType?: "flex" | "flex-col";
  disabled?: boolean;
};

export default function Toggle({
  label,
  initial = false,
  onToggle,
  sizes = "md",
  flexType = "flex",
  disabled = false,
}: ToggleProps) {
  const [enabled, setEnabled] = useState(initial);

  useEffect(() => {
    setEnabled(initial);
  }, [initial]);

  const handleToggle = () => {
    if (disabled) return;

    const newState = !enabled;
    setEnabled(newState);
    onToggle?.(newState);
  };

  const labelClass = {
    xs: "text-[10px] xl:text-xs",
    sm: "text-[10px] lg:text-md xl:text-sm",
    md: "text-[10px] lg:text-md xl:text-sm",
    lg: "text-md md:text-lg",
  }[sizes];

  return (
    <div
      className={
        flexType === "flex"
          ? "flex items-center space-x-4"
          : "flex flex-col space-y-2"
      }
    >
      {label && (
        <span className={`${labelClass} font-semibold text-gray-700`}>
          {label}
        </span>
      )}

      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? "bg-primary-1" : "bg-gray-300"
        } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
