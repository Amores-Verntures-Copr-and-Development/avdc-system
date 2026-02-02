import React from "react";
import { DropdownSearch } from "./DropDownSearch";
import { ItemInterface } from "@/types/items";

interface DropDownSearchItemProps {
  onSelect: (item: ItemInterface) => void;
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
const DropDownSearchItem = ({
  onSelect,
  onQueryChange,
  // renderItem,
  // displayValue,
  selectedValue = "",
  placeholder = "Search...",
  label,
  required = false,
  error,
  clearSignal,
  sizes = "md",
  disabled = false,
  loading = false,
}: DropDownSearchItemProps) => {
  const searchItems = async (query: string): Promise<ItemInterface[]> => {
    const res = await fetch(
      `/api/items/search?search=${encodeURIComponent(query)}`,
    );
    const json = await res.json();
    return json.data || [];
  };
  return (
    <DropdownSearch<ItemInterface>
      label={label}
      required={required}
      error={error}
      disabled={disabled}
      loading={loading}
      searchFn={searchItems}
      onSelect={onSelect}
      renderItem={(item) => (
        <span>
          <span>
            {item.itemName}{" "}
            <span className="font-semibold">({item.itemUnit})</span>
          </span>
        </span>
      )}
      displayValue={(s) => `${s.itemName}`}
      selectedValue={selectedValue}
      placeholder={placeholder}
      clearSignal={clearSignal}
      sizes={sizes}
      onQueryChange={onQueryChange}
    />
  );
};

export default DropDownSearchItem;
