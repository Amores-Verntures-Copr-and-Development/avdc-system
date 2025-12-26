import React, { useState } from "react";

type ToggleProps = {
  label?: string;
  initial?: boolean;
  onToggle?: (state: boolean) => void;
};

export default function Toggle({
  label,
  initial = false,
  onToggle,
}: ToggleProps) {
  const [enabled, setEnabled] = useState(initial);

  const handleToggle = () => {
    const newState = !enabled;
    setEnabled(newState);
    onToggle?.(newState);
  };

  return (
    <div className="flex items-center space-x-4">
      {label && <span className="text-sm font-medium">{label}</span>}
      <button
        onClick={handleToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? "bg-primary-1" : "bg-gray-300"
        }`}
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
