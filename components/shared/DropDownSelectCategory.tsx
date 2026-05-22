import React from "react";
import DropdownSelect from "./DropdownSelect";

import useSWR from "swr";
import { fetcher } from "@/utils/fetcher";
import { CategoryInterface } from "@/types/categories";
import { useSession } from "@/hooks/useSession";

interface DropDownSelectCategoryProps {
  categoryType: "item" | "product";
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
  referenceType: "stores" | "stock-room" | "inventoryId";
  id?: number;
}
const DropDownSelectCategory: React.FC<DropDownSelectCategoryProps> = ({
  categoryType,
  disabled,
  name,
  value,
  onChange,
  label,
  placeholder,
  required = false,
  error,
  sizes,
  referenceType,
  id,
}) => {
  const { user } = useSession();
  const categoryBaseUrl =
    referenceType === "stock-room"
      ? `api/categories/stock-room/${id}`
      : referenceType === "stores"
        ? `api/categories/stores/${user?.storeId}`
        : `api/categories`;

  console.log({ categoryBaseUrl, referenceType, id });
  const { data: response = { data: [] }, isLoading } = useSWR<{
    data: CategoryInterface[];
  }>(id ? categoryBaseUrl : null, fetcher);
  const options = [
    { label: "Select Category", value: "" }, // 👈 empty option first
    ...(response?.data
      ?.filter((cat) => cat.categoryType === categoryType)
      .map((cat) => ({
        label: cat.categoryName,
        value: String(cat.categoryId),
      })) || []),
  ];

  return (
    <DropdownSelect
      name={name}
      value={value}
      onChange={onChange}
      label={label}
      placeholder={placeholder}
      required={required}
      error={error}
      sizes={sizes}
      loading={isLoading}
      disabled={disabled}
      options={options}
    />
  );
};

export default DropDownSelectCategory;
