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
import { ArrowLeft, Plus } from "lucide-react";
import React, { useState } from "react";
import useSWR from "swr";
import AddVariantModal from "./components/AddVariantModal";
import { UserAuth } from "@/hooks/useSession";
import toast from "react-hot-toast";
import { formatPeso } from "@/utils/formatPeso";

interface ProductVariantPageProps {
  data: DisplayProductsDtos | null;
  user: UserAuth | null;
  onBack: () => void;
}

const columns: Column<DisplaProductVariantsDtos>[] = [
  { key: "#", name: "#", selector: (_row, index) => index + 1 },
  { key: "prodVarName", name: "Variant Name" },
  {
    key: "prodVarPrice",
    name: "Price",
    selector: (row) => formatPeso(row.prodVarPrice),
  },
];

const ProductVariantPage = ({
  data,
  onBack,
  user,
}: ProductVariantPageProps) => {
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
      ? `/api/products/${data.storeId}/product-variants/${data.prodId}`
      : null,
    fetcher
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
        }
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
          subtitle="Add, edit, and track products"
        />
        <div>
          <Button
            label="Back"
            icon={<ArrowLeft className="w-5 h-5" />}
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
          maxHeight="h-full"
          renderTopActions={
            <div className="flex items-center">
              <div>
                <Button
                  size="sm"
                  label="Add Variants"
                  icon={<Plus className="w-5 h-5" />}
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
    </>
  );
};

export default ProductVariantPage;
