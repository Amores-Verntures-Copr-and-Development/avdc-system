import { Supplier } from "@/types/supplier";
import { DropdownSearch } from "./DropDownSearch";

interface DropDownSearchSupplierProps<T> {
  onSelect: (item: Supplier) => void;
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

export const DropDownSearchSupplier = <T,>({
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
}: DropDownSearchSupplierProps<T>) => {
  const searchItems = async (query: string): Promise<Supplier[]> => {
    const res = await fetch(
      `/api/suppliers/search?search=${encodeURIComponent(query)}`
    );
    const json = await res.json();
    return json.data || [];
  };
  return (
    <DropdownSearch<Supplier>
      label={label}
      required={required}
      error={error}
      disabled={disabled}
      loading={loading}
      searchFn={searchItems}
      onSelect={onSelect}
      renderItem={(supplier) => (
        <span>
          <span>{supplier.suppName}</span>
        </span>
      )}
      displayValue={(s) => `${s.suppName}`}
      selectedValue={selectedValue}
      placeholder={placeholder}
      clearSignal={clearSignal}
      sizes={sizes}
      onQueryChange={onQueryChange}
    />
  );
};
