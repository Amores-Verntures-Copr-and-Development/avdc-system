import { CategoryInterface } from "@/types/categories";
import { InventoryItemInterface } from "@/types/inventory";
import { ItemInterface } from "@/types/items";
import React from "react";
import { DropdownSearch } from "./DropDownSearch";
import { formatQuantityByUnit } from "@/utils/formatQuantityByUnit";

export interface DisplaInventoryItems
  extends ItemInterface, InventoryItemInterface, CategoryInterface {}
interface SearchInventoryItemProps {
  onSelect: (item: DisplaInventoryItems) => void;
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
  inventoryId: number;
}
export const SearchInventoryItem = ({
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
  inventoryId,
}: SearchInventoryItemProps) => {
  const searchItems = async (
    query: string,
  ): Promise<DisplaInventoryItems[]> => {
    const res = await fetch(
      `/api/inventory/item/${inventoryId}?search=${encodeURIComponent(query)}`,
    );
    const json = await res.json();
    return json.data || [];
  };
  return (
    <DropdownSearch<DisplaInventoryItems>
      label={label}
      required={required}
      error={error}
      disabled={disabled}
      loading={loading}
      searchFn={searchItems}
      onSelect={onSelect}
      renderItem={(item) => (
        <span>
          <strong>{item.itemName}</strong> <span>({item.itemUnit})</span> •
          <span
            className={`ml-1 px-1.5 py-0.5 ${Number(item.inventoryItemQuantity) !== 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}  text-xs font-medium rounded`}
          >
            {formatQuantityByUnit(item.inventoryItemQuantity, item.itemUnit)}
          </span>
          <span className="text-gray-500 ml-1">in stock</span>
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

export default SearchInventoryItem;
