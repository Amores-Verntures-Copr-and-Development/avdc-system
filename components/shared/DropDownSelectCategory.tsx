import React from "react";
import DropdownSelect from "./DropdownSelect";
import { DisplayCategoryDto } from "@/dtos/category.dto";
import useSWR from "swr";
import { fetcher } from "@/utils/fetcher";

interface DropDownSelectCategoryProps {
  categoryType: "item" | "product";
  name: string;
  value: string | undefined;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  sizes?: "xs" | "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
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
}) => {
  const { data: response = { data: [] }, isLoading } = useSWR<{
    data: DisplayCategoryDto[];
  }>("/api/categories/", fetcher);
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
