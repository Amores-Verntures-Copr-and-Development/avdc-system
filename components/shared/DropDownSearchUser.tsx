import React from "react";
import { DropdownSearch } from "./DropDownSearch";
import { ItemInterface } from "@/types/items";
import { createPortal } from "react-dom";
import { EmployeeInterface } from "@/types/employees";
import { UserInterface } from "@/types/users";
interface DropDownSearchItemProps {
  onSelect: (item: UserFullDetails) => void;
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

export interface UserFullDetails extends EmployeeInterface, UserInterface {}
const DropDownSearchUser = ({
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
  const searchItems = async (query: string): Promise<UserFullDetails[]> => {
    const res = await fetch(`/api/users?search=${encodeURIComponent(query)}`);
    const json = await res.json();
    return json.data || [];
  };
  return (
    <DropdownSearch<UserFullDetails>
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
            {item.userFname} {item.userLname}{" "}
            {/* <span className="font-semibold">({item.itemUnit})</span> */}
          </span>
        </span>
      )}
      displayValue={(s) => `${s.userFname} ${s.userLname}`}
      selectedValue={selectedValue}
      placeholder={placeholder}
      clearSignal={clearSignal}
      sizes={sizes}
      onQueryChange={onQueryChange}
    />
  );
};

export default DropDownSearchUser;
