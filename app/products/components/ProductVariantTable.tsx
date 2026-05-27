import Button from "@/components/shared/Button";
import IconButton from "@/components/shared/IconButton";
import Table, { Column } from "@/components/shared/Table";
import { DisplaProductVariantsDtos } from "@/dtos/products.dto";
import { formatPeso } from "@/utils/formatPeso";
import { Eye, Plus, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useCallback, useMemo } from "react";
interface ProductVariantTableProps {
  data: DisplaProductVariantsDtos[];
  totalCount: number;
  isLoading: boolean;
  onRowSelection: (data: DisplaProductVariantsDtos) => void;
}
const prodVarcolumns: Column<DisplaProductVariantsDtos>[] = [
  { key: "#", name: "#", selector: (_row, index) => index + 1 },
  {
    key: "prodVarName",
    name: "Variant Name",
    selector: (row) => (
      <div className="flex flex-col">
        <span className="font-semibold text-sm">{row.prodVarName}</span>
        <span className="text-xs text-gray-500">{row.prodName}</span>
      </div>
    ),
  },
  {
    key: "prodVarPrice",
    name: "Price",
    selector: (row) => formatPeso(row.prodVarPrice),
  },

  {
    key: "isDeductInv",
    name: "Deduct Inventory",
    selector: (row) => {
      const label = Number(row.isDeductInv) === 1 ? "True" : "False";
      const textColor =
        Number(row.isDeductInv) === 1 ? "text-green-600" : "text-red-600";
      return (
        <div className="">
          <span
            className={`px-1.5 py-1.5 ${textColor} font-semibold rounded-lg`}
          >
            {label}
          </span>
        </div>
      );
    },
  },
  { key: "sold", name: "Sold", selector: (row) => (row.sold ? row.sold : 0) },
  {
    key: "totalSales",
    name: "Total Sales",
    selector: (row) =>
      row.totalSales ? formatPeso(row.totalSales) : formatPeso(0),
  },
];
const ProductVariantTable = ({
  data,
  isLoading,
  onRowSelection,
}: ProductVariantTableProps) => {
  const router = useRouter();
  // const [filters, setFilters] = useState<Record<string, string[]>>({});
  const productVariantConfig = useMemo(
    () => [
      {
        id: "status",
        label: "Status",
        type: "checkbox" as const,
        options: [
          { label: "Fast Moving", value: "fast" },
          { label: "Slow Moving", value: "slow" },
        ],
      },
    ],
    [],
  );
  const handleSave = useCallback(
    (newFilters: Record<string, string[]>) => {
      // setFilters(newFilters);
      const currentParams = new URLSearchParams(window.location.search);
      const filterKeys = [...productVariantConfig.map((f) => f.id), "branch"];

      filterKeys.forEach((key) => currentParams.delete(key));

      Object.entries(newFilters).forEach(([key, values]) => {
        values.forEach((value) => currentParams.append(key, value));
      });

      router.push(`?${currentParams.toString()}`);
    },
    [router, productVariantConfig],
  );
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
  return (
    <Table
      showDateRange
      onDateRangeChange={handleDateRangeChange}
      filterConfig={productVariantConfig}
      onSave={handleSave}
      showFilter={true}
      columns={prodVarcolumns}
      data={data}
      loading={isLoading}
      showActions
      onRowSelection={(row) => onRowSelection(row)}
      totalCount={10}
      showPagination
      searchUrl="/products"
      renderActions={(row) => (
        <div className="flex gap-1 xl:gap-2 px-1 justify-center">
          <IconButton
            onClick={function (): void {
              console.log(row);
            }}
            label={"View"}
            bg={"nobg"}
            icon={<Eye className="w-3 h-3 xl:w-4 xl:h-4" />}
          />
          <IconButton
            onClick={function (): void {
              console.log("Delete");
            }}
            label={"Delete"}
            bg={"red"}
            icon={<Trash className="w-3 h-3 xl:w-4 xl:h-4" />}
          />
        </div>
      )}
      maxHeight="h-full"
      renderTopActions={
        <div className="flex items-center">
          <div>
            <Button
              size="sm"
              label="Add Variants"
              icon={Plus}
              onClick={() => {
                // setShowAddModal(true);
              }}
            />
          </div>
        </div>
      }
    />
  );
};

export default ProductVariantTable;
