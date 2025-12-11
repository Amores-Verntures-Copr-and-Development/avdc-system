import BigCard from "@/components/shared/BigCard";
import Button from "@/components/shared/Button";

import { DisplaySupplierItemDto } from "@/dtos/supplier.dto";
import { formatDateToWords } from "@/utils/formatDateToWords";
import { formatPeso } from "@/utils/formatPeso";
import { Delete, Edit } from "lucide-react";
import React, { useEffect, useState } from "react";
import PriceUpdateCard from "./PriceUpdateCard";
import useSWR from "swr";
import { fetcher } from "@/utils/fetcher";
import { Supplier, SupplierItem, SupplierItemPrices } from "@/types/supplier";
import Modal from "@/components/shared/Modal";
import Input from "@/components/shared/Input";
import { handleChange } from "@/utils/handle-change";
import toast from "react-hot-toast";
import { UserAuth } from "@/hooks/useSession";

interface ViewSupplierItemModalProps {
  suppData: Supplier | null;
  data: DisplaySupplierItemDto | null;
  user: UserAuth | null;
  mutateSupplierItem: () => void;
  handleRemoveItemFromSupplier: (data: SupplierItem[]) => Promise<boolean>;
  isDeleting?: boolean;
  onClose: () => void;
}

const ViewSupplierItemModal = ({
  data,
  user,
  mutateSupplierItem,
  handleRemoveItemFromSupplier,
  isDeleting,
  suppData,
  onClose,
}: ViewSupplierItemModalProps) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUpdatePrice, setShowUpdatePrice] = useState(false);
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);
  const [updateForm, setUpdateForm] = useState<SupplierItem>({
    suppId: 0,
    suppItemCreatedAt: "",
    suppItemCreatedBy: 0,
    suppItemId: 0,
    suppItemPrice: 0,
    suppItemStatus: "actice",
    suppItemUpdatedAt: "",
    itemId: 0,
  });
  const {
    data: itemResponse = { data: [] },
    mutate,
    isLoading,
  } = useSWR<{
    data: SupplierItemPrices[];
  }>(
    `/api/suppliers/supplier-items/${data?.suppId}/${data?.suppItemId}`,
    fetcher
  );
  useEffect(() => {
    if (data) {
      setUpdateForm({ ...data, suppItemCreatedBy: user?.userId ?? 0 });
    }
  }, [data]);
  const handleUpdatePrice = async () => {
    console.log({ updateForm });
    setIsUpdatingPrice(true);
    try {
      const result = await fetch(
        `/api/suppliers/supplier-items/${data?.suppId}/${data?.suppItemId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateForm),
        }
      );
      const res = await result.json();
      if (!res.success) {
        throw new Error(res.err);
      }
      toast.success(res.message);
      mutate();
      mutateSupplierItem();
      setShowUpdatePrice(false);
      return true;
    } catch (e: any) {
      console.log(e);
      toast.error("Failed to update item in supplier");
      return false;
    } finally {
      setIsUpdatingPrice(false);
    }
  };
  const handleOnChage = handleChange(updateForm, setUpdateForm);
  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Buttons - Fixed at top */}
      <div className="flex justify-end gap-2">
        <Button
          label="Update Price"
          size="xs"
          isRounded={false}
          color="secondary"
          icon={<Edit className="w-3 h-3" />}
          onClick={() => {
            setShowUpdatePrice(true);
          }}
        />
        <Button
          label="Delete"
          size="xs"
          isRounded={false}
          onClick={() => {
            setShowDeleteModal(true);
          }}
          color="danger"
          icon={<Delete className="w-3 h-3" />}
        />
      </div>

      {/* Details Card - Fixed height content */}
      <BigCard title={"Details"} isRounded={false}>
        <div className="flex flex-col gap-4">
          <div className="flex justify-between">
            <label className="text-sm font-medium text-gray-500">
              Supplier Item ID
            </label>
            <p className="text-sm">{data?.suppItemId}</p>
          </div>
          <div className="flex justify-between">
            <label className="text-sm font-medium text-gray-500">Name</label>
            <p className="text-sm">{data?.itemName}</p>
          </div>
          <div className="flex justify-between">
            <label className="text-sm font-medium text-gray-500">Unit</label>
            <p className="text-sm">{data?.itemUnit}</p>
          </div>
          <div className="flex justify-between">
            <label className="text-sm font-medium text-gray-500">
              Category
            </label>
            <p className="text-sm">{data?.categoryName}</p>
          </div>
          <div className="flex justify-between">
            <label className="text-sm font-medium text-gray-500">Price</label>
            <p className="text-sm">{formatPeso(data?.suppItemPrice)}</p>
          </div>
          <div className="flex justify-between">
            <label className="text-sm font-medium text-gray-500">Created</label>
            <p className="text-sm">
              {formatDateToWords(data?.suppItemCreatedAt ?? "")}
            </p>
          </div>
          <div className="flex justify-between">
            <label className="text-sm font-medium text-gray-500">
              Last Updated
            </label>
            <p className="text-sm">
              {formatDateToWords(data?.suppItemUpdatedAt ?? "")}
            </p>
          </div>
        </div>
      </BigCard>

      {/* Price Update List - Scrollable area */}
      <BigCard
        title={"Price Update List"}
        isRounded={false}
        // Important: flex-1 to take remaining space
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            {/* A  <Spinner size="sm" /> dd a spinner component */}
          </div>
        ) : itemResponse.data && itemResponse.data.length > 0 ? (
          <div className="flex flex-col gap-2 h-full">
            {/* Scrollable container */}
            <div className="overflow-y-auto flex-1 pr-2">
              {" "}
              {/* Added pr-2 for scrollbar space */}
              {itemResponse.data.map((item, index) => (
                <PriceUpdateCard data={item} key={item.sipId} index={index} />
              ))}
            </div>

            {/* Optional: Show count */}
            <div className="pt-2 border-t">
              <p className="text-xs text-gray-500 text-right">
                Total: {itemResponse.data.length} price updates
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-gray-500">
            No price updates found
          </div>
        )}
      </BigCard>

      <Modal
        title="Update Supplier Item Price"
        isOpen={showUpdatePrice}
        onClose={() => setShowUpdatePrice(false)}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Input
                readOnly
                label={"Name"}
                value={data?.itemName}
                sizes={"xs"}
              />
              <Input
                readOnly
                label={"Previous Price"}
                value={formatPeso(data?.suppItemPrice)}
                sizes={"xs"}
              />
            </div>
            <Input
              label={"New Price"}
              value={updateForm?.suppItemPrice}
              name="suppItemPrice"
              sizes={"xs"}
              onChange={handleOnChage}
            />
          </div>
          <div className="flex justify-end gap-4">
            <Button
              size="sm"
              label="Cancel"
              color="secondary"
              onClick={() => setShowUpdatePrice(false)}
              disabled={isUpdatingPrice}
            />
            <Button
              size="sm"
              label="Update"
              onClick={handleUpdatePrice}
              loading={isUpdatingPrice}
            />
          </div>
        </div>
      </Modal>
      <Modal
        title={`Remove ${data?.supplierName}'s items`}
        isOpen={showDeleteModal}
        onClose={function (): void {
          setShowDeleteModal(false);
        }}
      >
        <div className="space-y-4">
          {" "}
          <div className="text-center">
            Are you sure you want to remove{" "}
            <span className="font-semibold">{data?.itemName}</span> from{" "}
            {suppData?.suppName}?
          </div>
          <div className="flex justify-end gap-4">
            <div>
              <Button size="sm" label="Cancel" color="secondary" />
            </div>
            <div>
              <Button
                size="sm"
                label="Remove"
                loading={isDeleting}
                onClick={async () => {
                  if (!data) {
                    return;
                  }
                  const success = await handleRemoveItemFromSupplier([data]);
                  if (success) {
                    setShowDeleteModal(false);
                    onClose();
                  }
                }}
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ViewSupplierItemModal;
