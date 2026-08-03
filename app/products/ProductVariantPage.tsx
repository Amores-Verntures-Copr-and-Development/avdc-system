import Button from "@/components/shared/Button";
import Modal from "@/components/shared/Modal";
import PageHeader from "@/components/shared/PageHeader";

import Table, { Column } from "@/components/shared/Table";
import {
  CreateProductVariantDto,
  DisplaProductVariantsDtos,
  DisplayProductsDtos,
} from "@/dtos/products.dto";
import { fetcher } from "@/utils/fetcher";
import { ArrowLeft, Barcode, Eye, ImageIcon, Plus, Trash } from "lucide-react";
import React, { useState } from "react";
import useSWR from "swr";
import AddVariantModal from "./components/AddVariantModal";
import { UserAuth } from "@/hooks/useSession";
import toast from "react-hot-toast";
import { formatPeso } from "@/utils/formatPeso";
import IconButton from "@/components/shared/IconButton";
import ConfirmationModal from "@/components/shared/ConfirmationModal";
import BarcodeProductComponent from "./components/BarcodeProductComponent";
import { useRouter } from "next/navigation";

interface ProductVariantPageProps {
  data: DisplayProductsDtos | null;
  user?: UserAuth | null;
  onBack: () => void;
}

const columns: Column<DisplaProductVariantsDtos>[] = [
  { key: "#", name: "#", selector: (_row, index) => index + 1 },
  {
    key: "prodVarImage",
    name: "Image",
    selector: (row) =>
      row.prodVarImage ? (
        <img
          src={`${process.env.NEXT_PUBLIC_NEXT_CLOUD_IMAGE_PREVIEW}${row.prodVarImage}`}
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

const ProductVariantPage = ({
  data,
  onBack,
  user,
}: ProductVariantPageProps) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showBarcode, setShowBarcode] =
    useState<DisplaProductVariantsDtos | null>(null);
  const [showDeleteConfirmation, setShowDeleteComfirmation] =
    useState<DisplaProductVariantsDtos | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    data: itemResponse = { data: [] },
    mutate,
    isLoading,
  } = useSWR<{
    data: DisplaProductVariantsDtos[];
  }>(
    data
      ? `/api/products/${data.storeId}/product-variants/${data.prodId}/`
      : null,
    fetcher,
  );
  const handleAddVariant = async (prodVariant: CreateProductVariantDto) => {
    console.log({ data });
    setIsSubmitting(true);
    const newData: CreateProductVariantDto = {
      ...prodVariant,
      prodId: data?.prodId ?? 0,
      prodVarCreatedBy: user?.userId ?? 0,
    };
    try {
      const response = await fetch(
        `/api/products/${data?.storeId}/product-variants/${data?.prodId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newData),
          credentials: "include",
        },
      );

      const res = await response.json();

      if (!res.success) {
        throw new Error(res.err);
      }
      toast.success(res.message);
      if (mutate) {
        mutate();
      }
      return true;
    } catch (e) {
      console.log(e);
      toast.success("Failed!");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleDeleteProductVariant = async (
    deleteData: DisplaProductVariantsDtos,
  ) => {
    setIsDeleting(true);
    try {
      const res = await fetch(
        `/api/products/${data?.storeId}/product-variants/${deleteData.prodId}/${deleteData.prodVarId}/`,
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
  return (
    <>
      <div className="flex justify-between items-center">
        <PageHeader
          title={data?.prodName ?? ""}
          subtitle="Manage product variants"
        />
        <div>
          <Button
            label="Back"
            icon={ArrowLeft}
            size="sm"
            color="secondary"
            onClick={onBack}
          />
        </div>
      </div>
      <div className="flex-1 min-h-0  flex flex-col justify-between overflow-hidden">
        <Table
          columns={columns}
          data={itemResponse.data}
          loading={isLoading}
          showActions
          onRowSelection={(row) =>
            router.push(`/products/${row.prodId}/${row.prodVarId}`)
          }
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
          renderTopActions={
            <div className="flex items-center">
              <div>
                <Button
                  size="sm"
                  label="Add Variants"
                  icon={Plus}
                  onClick={() => {
                    setShowAddModal(true);
                  }}
                />
              </div>
            </div>
          }
          renderMobileCard={(row, index) => {
            const imageUrl = row.prodVarImage
              ? `${process.env.NEXT_PUBLIC_NEXT_CLOUD_IMAGE_PREVIEW}${row.prodVarImage}`
              : "";

            return (
              <div
                onClick={() =>
                  router.push(`/products/${row.prodId}/${row.prodVarId}`)
                }
                className="flex cursor-pointer flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm"
              >
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
                    <p className="font-semibold text-red-600">
                      {row.sold || 0}
                    </p>
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
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/products/${row.prodId}/${row.prodVarId}`);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowBarcode(row);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-blue-200 text-blue-600 hover:bg-blue-50"
                  >
                    <Barcode className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteComfirmation(row);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          }}
        />
      </div>
      <Modal
        title={`Add ${data?.prodName} variants`}
        isOpen={showAddModal}
        onClose={function (): void {
          setShowAddModal(false);
        }}
      >
        <AddVariantModal
          onSubmit={handleAddVariant}
          mutate={mutate}
          isSubmitting={isSubmitting}
        />
      </Modal>
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
    </>
  );
};

export default ProductVariantPage;
