import React from "react";
import DropdownSelect from "./DropdownSelect";
import { ItemInterface } from "@/types/items";
import { fetcher } from "@/utils/fetcher";
import useSWR from "swr";
import { CategoryInterface } from "@/types/categories";

interface DisplayItems extends ItemInterface, CategoryInterface {}

interface DropDownSelectItemConversionProps {
  name: string;
  value: string | undefined;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  sizes?: "xs" | "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  itemName?: string;
  id?: number;
  selectedItem?: (data: DisplayItems | null) => void; // Updated to accept null
}

const DropDownSelectItemConversion = ({
  disabled,
  name,
  value,
  onChange,
  label,
  placeholder,
  required = false,
  error,
  sizes,
  itemName,
  id,
  selectedItem, // Add selectedItem prop
}: DropDownSelectItemConversionProps) => {
  const { data: response = { data: [] }, isLoading } = useSWR<{
    data: DisplayItems[];
  }>(itemName ? `/api/items/name/${itemName}` : null, fetcher);

  // Create the options array
  const filteredItems = response?.data.filter((i) => i.itemId !== id) || [];

  const options = [
    { label: "Select Item", value: "" }, // Empty option
    ...filteredItems.map((item) => ({
      label: `${item.itemName} (${item.itemUnit})`,
      value: item.itemId?.toString() || "", // Ensure string value
      itemData: item, // Store the full item data
    })),
  ];

  // Handle change and call selectedItem callback
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // Call original onChange if provided
    if (onChange) {
      onChange(e);
    }

    // Call selectedItem with the full item data
    if (selectedItem) {
      const selectedValue = e.target.value;

      if (selectedValue === "") {
        selectedItem(null); // Return null for empty selection
        return;
      }

      // Find the selected item from filteredItems
      const selectedItemData = filteredItems.find(
        (item) => item.itemId?.toString() === selectedValue
      );

      if (selectedItemData) {
        selectedItem(selectedItemData);
      } else {
        selectedItem(null);
      }
    }
  };

  return (
    <DropdownSelect
      name={name}
      value={value}
      onChange={handleChange} // Use custom handler
      label={label}
      placeholder={placeholder}
      required={required}
      error={error}
      sizes={sizes}
      loading={isLoading}
      disabled={disabled}
      options={options.map((opt) => ({
        label: opt.label,
        value: opt.value,
      }))} // Map to basic options for DropdownSelect
    />
  );
};

export default DropDownSelectItemConversion;
