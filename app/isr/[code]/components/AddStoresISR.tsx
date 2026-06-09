import Button from "@/components/shared/Button";
import { DropdownSearch } from "@/components/shared/DropDownSearch";
import { CreateISRStoreDto } from "@/dtos/isr.dto";
import { useSession } from "@/hooks/useSession";
import { InterStoreRequests } from "@/types/isr";
import { StoreInterface } from "@/types/stores";
import React, { useState } from "react";
import toast from "react-hot-toast";

interface AddStoresISRProps {
  data: InterStoreRequests;
  onClose: () => void;
  mutate: () => void;
}

const AddStoresISR = ({ data, onClose, mutate }: AddStoresISRProps) => {
  const { user } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<CreateISRStoreDto>({
    isrId: data.isrId,
    storeId: 0,
    isrStoreCreatedBy: 0,
  });
  const searchStore = async (query: string): Promise<StoreInterface[]> => {
    const res = await fetch(
      `/api/isr/${data.isrCode}/stores/not-in?search=${encodeURIComponent(query)}`,
    );
    const json = await res.json();
    return json.data || [];
  };
  const handleAddISRStore = async () => {
    setIsSubmitting(true);
    try {
      if (!user) {
        toast.error("User is required to perform this action!");
        return;
      }

      const body: CreateISRStoreDto = {
        ...form,
        isrStoreCreatedBy: user?.userId,
        isrId: data.isrId,
      };

      const res = await fetch(`/api/isr/${data.isrCode}/stores`, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await res.json();
      if (!result.success) {
        toast.error("Failed to add store in ISR!");
        return;
      }

      toast.success("Store added to ISR successfully!");
      mutate();
      onClose();
    } catch (e) {
      toast.error("Failed to add store!");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
        <div className="flex gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            i
          </div>

          <div>
            <p className="text-sm font-semibold text-blue-900">Add Store</p>

            <p className="mt-1 text-xs leading-5 text-blue-700">
              Store can request under this ISR.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-500">
          Select Store
        </label>

        <DropdownSearch<StoreInterface>
          searchFn={searchStore}
          onSelect={(s) => {
            if (s.storeId) {
              setForm((prev) => ({
                ...prev,
                storeId: s.storeId ?? 0,
              }));
            }
          }}
          renderItem={(item) => (
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900">
                {item.storeName}
              </span>
            </div>
          )}
          displayValue={(user) => user.storeName}
        />
      </div>

      <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
        <Button
          label="Cancel"
          size="sm"
          onClick={onClose}
          color="secondary"
          disabled={isSubmitting}
        />

        <Button
          label="Add Purchaser"
          size="sm"
          onClick={handleAddISRStore}
          loading={isSubmitting}
          disabled={isSubmitting || form.storeId === 0}
        />
      </div>
    </div>
  );
};

export default AddStoresISR;
