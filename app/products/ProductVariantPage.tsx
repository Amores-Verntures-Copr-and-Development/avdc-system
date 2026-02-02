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
import { ArrowLeft, Eye, Plus, Trash } from "lucide-react";
import React, { useState } from "react";
import useSWR from "swr";
import AddVariantModal from "./components/AddVariantModal";
import { UserAuth } from "@/hooks/useSession";
import toast from "react-hot-toast";
import { formatPeso } from "@/utils/formatPeso";
import IconButton from "@/components/shared/IconButton";
import Popup from "@/components/shared/Popup";
import VariantComponentPage from "./components/VariantComponentPage";

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

const ProductVariantPage = ({
  data,
  onBack,
  user,
}: ProductVariantPageProps) => {
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
    </>
  );
};

export default ProductVariantPage;
