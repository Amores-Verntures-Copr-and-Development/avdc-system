import Button from "@/components/shared/Button";
import DynamicDropdown from "@/components/shared/DynamicDropdown";
import Table, { Column } from "@/components/shared/Table";
import { DisplayInventoryMovementDto } from "@/dtos/inventory.dto";
import { useCategories } from "@/hooks/useCategory";
import { fetcher } from "@/utils/fetcher";
import { formatDateToWords } from "@/utils/formatDateToWords";
import { getMovementType } from "@/utils/formatMovementType";
import { Download } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
const columns: Column<DisplayInventoryMovementDto>[] = [
  { key: "#", name: "#", selector: (_row, index) => index + 1 },
  { name: "Item Name", key: "itemName" },
  { name: "Unit", key: "itemUnit" },
  { name: "Category", key: "categoryName" },
  {
    name: "Type",
    key: "itemMovementType",
    selector: (row) => {
      const { type, textClass, bgClass, borderClass } = getMovementType(
        row.itemMovementType,
      );
      return (
        <div className="py-1">
          {" "}
          <span
            className={`px-2 py-1 rounded-lg font-semibold ${bgClass} ${textClass} ${borderClass} text-[10px]`}
          >
            {type}
          </span>
        </div>
      );
    },
  },
  { name: "Reference", key: "itemMovementReference" },
  { name: "Quantity", key: "itemMovementQuantity" },
  {
    name: "Created At",
    key: "itemMovementCreatedAt",
    selector: (row) => formatDateToWords(row.itemMovementCreatedAt ?? ""),
  },
  { name: "Remarks", key: "itemMovementRemarks" },
];
interface StockMovementSectionProps {
  inventoryId: number | null;
}
const StockMovementSection: React.FC<StockMovementSectionProps> = ({
  inventoryId,
}) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { categoryOptions } = useCategories({
    inventoryId: inventoryId ?? 0,
    reference: "inventoryId",
  });
  const url = `/api/inventory/movement/${inventoryId}`;
  const apiUrl = useMemo(() => {
    if (!inventoryId) return null;

    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const category = searchParams.get("category") || "";
    const unit = searchParams.get("unit") || "";
    const limit = searchParams.get("limit") || "";
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";
    const page = searchParams.get("page") || "1";
    const type = searchParams.get("type");
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (status) params.append("status", status);
    if (category) params.append("category", category);
    if (from) params.append("from", from);
    if (to) params.append("to", to);
    if (unit) params.append("unit", unit);
    if (limit) params.append("limit", limit);
    if (type) params.append("type", type);
    if (category) params.append("category", category);
    params.append("page", page);

    return `${url}?${params.toString()}`;
  }, [inventoryId, searchParams]);
  const { data: itemResponse = { data: [] }, isLoading: loading } = useSWR<{
    data: DisplayInventoryMovementDto[];
  }>(inventoryId ? apiUrl : null, fetcher);

  const [filters, setFilters] = useState<Record<string, string[]>>({});

  useEffect(() => {
    router.replace(pathname); // replace = no history pollution
  }, [router, pathname]);
  const handleDateRangeChange = useCallback(
    (rangeData: { from: string; to: string }) => {
      const { from, to } = rangeData;

      const url = new URL(window.location.href);

      if (from) {
        url.searchParams.set("from", from);
      } else {
        url.searchParams.delete("from");
      }

      if (to) {
        url.searchParams.set("to", to);
      } else {
        url.searchParams.delete("to");
      }

      router.push(url.toString());
    },
    [router],
  );
  const filterConfig = useMemo(
    () => [
      {
        id: "type",
        label: "Type",
        type: "checkbox" as const,
        options: [
          { label: "In", value: "in" },
          { label: "Out", value: "out" },
        ],
      },
      {
        id: "category",
        label: "Categories",
        type: "checkbox" as const,
        options: categoryOptions ?? [],
      },
    ],
    [categoryOptions],
  );
  const handleSave = useCallback(
    (newFilters: Record<string, string[]>) => {
      setFilters(newFilters);
      const currentParams = new URLSearchParams(window.location.search);
      const filterKeys = [...filterConfig.map((f) => f.id), "branch"];

      filterKeys.forEach((key) => currentParams.delete(key));

      Object.entries(newFilters).forEach(([key, values]) => {
        values.forEach((value) => currentParams.append(key, value));
      });

      router.push(`?${currentParams.toString()}`);
    },
    [router, filterConfig],
  );
  return (
    <>
      <Table
        renderTopActions={
          <div className="flex">
            <div className="">
              <DynamicDropdown
                options={[
                  { label: "Quantity", value: "quantity" },
                  { label: "By Date", value: "date" },
                ]}
                onChange={function (value: string | number): void {
                  throw new Error("Function not implemented.");
                }}
                placeholder={"Export"}
                icon={<Download className="w-4 h-4" />}
                size="sm"
              />
            </div>
          </div>
        }
        searchUrl={pathname}
        showDateRange
        showFilter={true}
        onDateRangeChange={handleDateRangeChange}
        maxHeight="h-full"
        onSave={handleSave}
        columns={columns}
        data={itemResponse.data}
        loading={loading}
        totalCount={20}
        filterConfig={filterConfig}
      />
    </>
  );
};

export default StockMovementSection;
