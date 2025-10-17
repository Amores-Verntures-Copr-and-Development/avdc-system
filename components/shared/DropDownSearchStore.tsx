import React from "react";
import { DropdownSearch } from "./DropDownSearch";

interface DropDownSearchStoreProps<T> {
  searchFn: (query: string) => Promise<T[]>;
  onSelect: (item: T) => void;
  renderItem: (item: T) => React.ReactNode;
  displayValue: (item: T) => string;
  selectedValue?: string;
  placeholder?: string;
  label?: string;
  required?: boolean;
  error?: string;
  clearSignal?: number;
  sizes?: "xs" | "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  onQueryChange?: (query: string) => void;
}

// Make component generic
const DropDownSearchStore = <T,>({
  searchFn,
  onSelect,
  onQueryChange,
  renderItem,
  displayValue,
  selectedValue = "",
  placeholder = "Search...",
  label,
  required = false,
  error,
  clearSignal,
  sizes = "md",
  disabled = false,
  loading = false,
}: DropDownSearchStoreProps<T>) => {
  return (
    <DropdownSearch<T>
      label={label}
      required={required}
      error={error}
      disabled={disabled}
      loading={loading}
      searchFn={searchFn}
      onSelect={onSelect}
      renderItem={renderItem}
      displayValue={displayValue}
      selectedValue={selectedValue}
      placeholder={placeholder}
      clearSignal={clearSignal}
      sizes={sizes}
      onQueryChange={onQueryChange}
    />
  );
};

export default DropDownSearchStore;
