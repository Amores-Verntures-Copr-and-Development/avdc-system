import Button from "@/components/shared/Button";
import ConfirmationModal from "@/components/shared/ConfirmationModal";
import IconButton from "@/components/shared/IconButton";
import Modal from "@/components/shared/Modal";
import Table, { Column } from "@/components/shared/Table";
import { DisplaProductVariantsDtos } from "@/dtos/products.dto";
import { formatPeso } from "@/utils/formatPeso";
import { Barcode, Eye, Plus, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";
import BarcodeProductComponent from "./BarcodeProductComponent";
import Popup from "@/components/shared/Popup";
import VariantComponentPage from "./VariantComponentPage";
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
    selector: (row) => row.prodVarUnit,
  },
  {
    key: "barcode",
    name: "Barcode",
    selector: (row) => <span className="font-semibold">{row.barcode}</span>,
  },
  {
    key: "prodVarPrice",
    name: "Price",
    selector: (row) => (
      <span className="font-semibold">{formatPeso(row.prodVarPrice)}</span>
    ),
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
    ],
    [],
  );
  const [showAddComponent, setShowAddComponent] = useState(false);
  const [selectedRow, setSelectedRow] =
    useState<DisplaProductVariantsDtos | null>(null);
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
        onRowSelection={(row) => setSelectedRow(row)}
        totalCount={totalCount}
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
      <Popup
        title={`${selectedRow?.prodVarName} ${selectedRow?.barcode}`}
        background="bg-white/10 backdrop-blur-xs"
        isOpen={selectedRow !== null}
        onClose={function (): void {
          setSelectedRow(null);
        }}
      >
        <VariantComponentPage
          data={selectedRow}
          prod={null}
          storeId={storeId}
          mutate={mutate}
          onClose={function (): void {
            setSelectedRow(null);
          }}
          showAddComponent={false}
          setShowAddComponent={setShowAddComponent}
        />
      </Popup>
    </>
  );
};

export default ProductVariantTable;
