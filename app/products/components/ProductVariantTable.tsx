import Button from "@/components/shared/Button";
import { getNextCloudImageUrl } from "@/utils/getNextCloudImageUrl";
import ConfirmationModal from "@/components/shared/ConfirmationModal";
import IconButton from "@/components/shared/IconButton";
import Modal from "@/components/shared/Modal";
import Table, { Column } from "@/components/shared/Table";
import { DisplaProductVariantsDtos } from "@/dtos/products.dto";
import { formatPeso } from "@/utils/formatPeso";
import { Barcode, Eye, ImageIcon, Plus, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";
import BarcodeProductComponent from "./BarcodeProductComponent";
interface ProductVariantTableProps {
  data: DisplaProductVariantsDtos[];
  storeId: number;
  totalCount: number;
  isLoading: boolean;
  onRowSelection: (data: DisplaProductVariantsDtos) => void;
  mutate: () => void;
}
const prodVarcolumns: Column<DisplaProductVariantsDtos>[] = [
  { key: "#", name: "#", selector: (_row, index) => index + 1 },
  {
    key: "prodVarImage",
    name: "Image",
    selector: (row) =>
      row.prodVarImage ? (
        <img
          src={getNextCloudImageUrl(row.prodVarImage)}
          alt={row.prodVarName}
          className="w-10 h-10 rounded-md object-cover"
        />
      ) : (
        <div className="w-10 h-10 rounded-md bg-gray-100" />
      ),
  },
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
    key: "prodVarUnit",
    name: "Unit",
  },
  {
    key: "barcode",
    name: "Barcode",
    selector: (row) => <span className="font-semibold">{row.barcode}</span>,
  },
  {
    key: "totalCost",
    name: "Cost Price",
    selector: (row) => formatPeso(row.totalCost),
  },
  {
    key: "prodVarPrice",
    name: "Seling Price",
    selector: (row) => formatPeso(row.prodVarPrice),
  },
  {
    key: "profit",
    name: "Profit",
    selector: (row) =>
      `${formatPeso(row.profit)}(${Number(row.profitPercentage).toFixed(2)}%)`,
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
  {
    key: "isAvailableOnline",
    name: "Online",
    selector: (row) => {
      const label = Number(row.isAvailableOnline) === 1 ? "Yes" : "No";
      const textColor =
        Number(row.isAvailableOnline) === 1 ? "text-green-600" : "text-red-600";
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
  {
    key: "inventoryItemQuantity",
    name: "Stocks",
    selector: (row) => (
      <span className="font-semibold text-green-600">
        {row.inventoryItemQuantity ? row.inventoryItemQuantity : 0}
      </span>
    ),
  },
  {
    key: "sold",
    name: "Sold",
    selector: (row) => (
      <span className="font-semibold text-red-600">
        {row.sold ? row.sold : 0}
      </span>
    ),
  },
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
  totalCount,
  mutate,
  storeId,
}: ProductVariantTableProps) => {
  const router = useRouter();
  const [showBarcode, setShowBarcode] =
    useState<DisplaProductVariantsDtos | null>(null);
  const [showDeleteConfirmation, setShowDeleteComfirmation] =
    useState<DisplaProductVariantsDtos | null>(null);
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
      {
        id: "isAvailableOnline",
        label: "Is Online?",
        type: "checkbox" as const,
        options: [
          { label: "Yes", value: "1" },
          { label: "No", value: "0" },
        ],
      },
    ],
    [],
  );
  const handleDeleteProductVariant = async (
    deleteData: DisplaProductVariantsDtos,
  ) => {
    setIsDeleting(true);
    try {
      const res = await fetch(
        `/api/products/${storeId}/product-variants/${deleteData.prodId}/${deleteData.prodVarId}/`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      const result = await res.json();
      if (!result.success) {
        throw new Error(result.success);
      }
      mutate();
      toast.success(
        `${showDeleteConfirmation?.prodVarName} is deleted successfully!`,
      );
      setShowDeleteComfirmation(null);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsDeleting(false);
    }
  };
  const [isDeleting, setIsDeleting] = useState(false);
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
    <>
      {" "}
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
        onRowSelection={(row) =>
          router.push(`/products/${row.prodId}/${row.prodVarId}`)
        }
        totalCount={totalCount}
        showPagination
        searchUrl="/products"
        renderActions={(row) => (
          <div className="flex gap-1 xl:gap-2 px-1 justify-center">
            <IconButton
              onClick={() =>
                router.push(`/products/${row.prodId}/${row.prodVarId}`)
              }
              label={"View"}
              bg={"nobg"}
              icon={<Eye className="w-5 h-5 xl:w-5 xl:h-5" />}
            />
            <IconButton
              onClick={function (): void {
                setShowBarcode(row);
              }}
              label={"Barcode"}
              bg={"blue"}
              icon={<Barcode className="w-5 h-5 xl:w-5 xl:h-5" />}
            />
            <IconButton
              onClick={function (): void {
                setShowDeleteComfirmation(row);
              }}
              label={"Delete"}
              bg={"red"}
              icon={<Trash className="w-5 h-5 xl:w-5 xl:h-5" />}
            />
          </div>
        )}
        maxHeight="h-full"
        renderTopActionButtons={[
          {
            props: {
              label: "Add Variants",
              icon: Plus,
              size: "sm",
              className: "font-semibold",
              color: "primary",
            },
          },
        ]}
        renderMobileCard={(row, index) => {
          const imageUrl = getNextCloudImageUrl(row.prodVarImage);

          return (
            <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
              <div className="flex items-start justify-between">
                <span className="rounded-full bg-pink-50 px-2 py-1 text-[11px] font-semibold text-primary-1">
                  #{index + 1}
                </span>
              </div>

              <div className="flex items-center gap-2 2xl:gap-3">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={row.prodVarName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-5 w-5 text-gray-300" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="2xl:truncate text-[10px] 2xl:text-sm font-semibold text-gray-900">
                    {row.prodVarName}
                  </p>
                  <p className="2xl:truncate text-xs text-gray-500">
                    {row.prodName}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="rounded-full bg-pink-50 px-2 py-0.5 text-[10px] font-semibold text-primary-1">
                      {row.prodVarUnit || "pc"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-gray-500">
                Barcode: {row.barcode || "No Barcode"}
              </div>

              <div className="grid grid-cols-2 gap-2 border-t border-gray-100 pt-2 text-xs">
                <div>
                  <p className="text-[10px] text-gray-400">Price</p>
                  <p className="font-semibold text-gray-900">
                    {formatPeso(row.prodVarPrice)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400">Stock</p>
                  <p className="font-semibold text-green-600">
                    {row.inventoryItemQuantity || 0}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400">Sold</p>
                  <p className="font-semibold text-red-600">{row.sold || 0}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400">Sales</p>
                  <p className="font-semibold text-gray-900">
                    {row.totalSales
                      ? formatPeso(row.totalSales)
                      : formatPeso(0)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 border-t border-gray-100 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    router.push(`/products/${row.prodId}/${row.prodVarId}`)
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowBarcode(row)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  <Barcode className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteComfirmation(row)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-red-200 text-red-600 hover:bg-red-50"
                >
                  <Trash className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        }}
      />
      <ConfirmationModal
        title={`Delete ${showDeleteConfirmation?.prodVarName}`}
        onConfirm={() => {
          if (showDeleteConfirmation) {
            handleDeleteProductVariant(showDeleteConfirmation);
          }
        }}
        confirmationInfo={`Are you sure you want to delete ${showDeleteConfirmation?.prodVarName}`}
        isLoading={isDeleting}
        onClose={function (): void {
          setShowDeleteComfirmation(null);
        }}
        isShow={showDeleteConfirmation !== null}
        confirmLabel="Delete"
      />
      <Modal
        isOpen={showBarcode !== null}
        onClose={function (): void {
          setShowBarcode(null);
        }}
        title={`${showBarcode?.prodVarName} Barcode`}
      >
        <BarcodeProductComponent
          data={showBarcode}
          onCancel={function (): void {
            setShowBarcode(null);
          }}
          mutate={function (): void {
            mutate();
          }}
        />
      </Modal>
    </>
  );
};

export default ProductVariantTable;
