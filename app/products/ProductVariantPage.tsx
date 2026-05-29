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
import { ArrowLeft, Barcode, Eye, Plus, Trash } from "lucide-react";
import React, { useState } from "react";
import useSWR from "swr";
import AddVariantModal from "./components/AddVariantModal";
import { UserAuth } from "@/hooks/useSession";
import toast from "react-hot-toast";
import { formatPeso } from "@/utils/formatPeso";
import IconButton from "@/components/shared/IconButton";
import Popup from "@/components/shared/Popup";
import VariantComponentPage from "./components/VariantComponentPage";
import ConfirmationModal from "@/components/shared/ConfirmationModal";
import BarcodeProductComponent from "./components/BarcodeProductComponent";

interface ProductVariantPageProps {
  data: DisplayProductsDtos | null;
  user?: UserAuth | null;
  onBack: () => void;
}

const columns: Column<DisplaProductVariantsDtos>[] = [
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
  },
  {
    key: "barcode",
    name: "Barcode",
    selector: (row) => <span className="font-semibold">{row.barcode}</span>,
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [showBarcode, setShowBarcode] =
    useState<DisplaProductVariantsDtos | null>(null);
  const [showDeleteConfirmation, setShowDeleteComfirmation] =
    useState<DisplaProductVariantsDtos | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddComponent, setShowAddComponent] = useState(false);
  const [selectedRow, setSelectedRow] =
    useState<DisplaProductVariantsDtos | null>(null);
  const [isShowModal, setIsShowModal] = useState<"variant" | "delete" | null>(
    null,
  );
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
  const updateData = async () => {
    const data = await mutate();
    const findSelectedRowToData = data?.data.find(
      (i) => i.prodVarId === selectedRow?.prodVarId,
    );
    if (findSelectedRowToData) {
      setSelectedRow(findSelectedRowToData);
    }
  };
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
          onRowSelection={(row) => {
            setSelectedRow(row);
            console.log({ row });
            setIsShowModal("variant");
          }}
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
                    setShowAddModal(true);
                  }}
                />
              </div>
            </div>
          }
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
      <Popup
        title={`${
          data?.prodName
        } (${selectedRow?.prodVarName?.toLocaleLowerCase()})`}
        background="bg-white/10 backdrop-blur-xs"
        isOpen={isShowModal === "variant"}
        onClose={function (): void {
          setIsShowModal(null);
        }}
        closeOnClickOutside={!showAddComponent}
      >
        {isShowModal === "variant" ? (
          <VariantComponentPage
            data={selectedRow}
            showAddComponent={showAddComponent}
            setShowAddComponent={setShowAddComponent}
            prod={data}
            storeId={data?.storeId ?? 0}
            mutate={updateData}
            onClose={function (): void {
              setIsShowModal(null);
            }}
          />
        ) : (
          <></>
        )}
      </Popup>
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
