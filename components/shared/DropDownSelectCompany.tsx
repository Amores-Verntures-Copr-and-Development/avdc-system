import React from "react";
import DropdownSelect from "./DropdownSelect";

import useSWR from "swr";
import { fetcher } from "@/utils/fetcher";
import { Companies } from "@/types/company";

interface DropDownSelectCompanyProps {
  name: string;
  value: string | undefined;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  sizes?: "xs" | "sm" | "md" | "lg";
  disabled?: boolean;
}

const DropDownSelectCompany: React.FC<DropDownSelectCompanyProps> = ({
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
    data: Companies[];
  }>("/api/companies", fetcher);

  const options = [
    { label: "Select Company", value: "" },
    ...(response?.data?.map((company) => ({
      label: company.companyName,
      value: String(company.companyId),
    })) ?? []),
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

export default DropDownSelectCompany;
