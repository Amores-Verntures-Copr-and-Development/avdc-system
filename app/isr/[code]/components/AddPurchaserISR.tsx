import Button from "@/components/shared/Button";
import { DropdownSearch } from "@/components/shared/DropDownSearch";
import SearchBar from "@/components/shared/SearchBar";
import { CreateISRPurchaserDto } from "@/dtos/isr.dto";
import { DisplayUserDto } from "@/dtos/user.dto";
import { useSession } from "@/hooks/useSession";
import { InterStoreRequests } from "@/types/isr";
import { stringify } from "querystring";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { json } from "stream/consumers";

interface AddPurchaserISRProps {
  data: InterStoreRequests;
  onClose: () => void;
  mutate: () => void;
}
const AddPurchaserISR = ({ data, onClose, mutate }: AddPurchaserISRProps) => {
  const { user } = useSession();
  const [form, setForm] = useState<CreateISRPurchaserDto>({
    userId: 0,
    isrId: 0,
    isrPurCreatedBy: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchUser = async (query: string): Promise<DisplayUserDto[]> => {
    const res = await fetch(
      `/api/isr/${data.isrCode}/purchaser/not-in?search=${encodeURIComponent(query)}`,
    );
    const json = await res.json();
    return json.data || [];
  };
  const handleAddISRPurchaser = async () => {
    setIsSubmitting(true);
    try {
      if (!user) {
        toast.error("No user logged in!");
        return;
      }
      const body: CreateISRPurchaserDto = {
        ...form,
        isrId: data.isrId,
        isrPurCreatedBy: user?.userId,
      };

      const res = await fetch(`/api/isr/${data.isrCode}/purchaser`, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await res.json();
      console.log({ result });
      if (!result.success) {
        throw new Error(result.message || "Failed to add ISR Purchaser");
      }
      toast.success("New user added to ISR Purchaser!");
      mutate();
      onClose();
    } catch (e) {
      toast.error("Failed to add ISR Purchaser!");
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
            <p className="text-sm font-semibold text-blue-900">
              Assign Purchaser
            </p>

            <p className="mt-1 text-xs leading-5 text-blue-700">
              This user will be assigned as the purchaser for this ISR and will
              be responsible for processing supplier purchasing items.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-500">
          Select Purchaser
        </label>

        <DropdownSearch<DisplayUserDto>
          searchFn={searchUser}
          onSelect={(user) => {
            setForm((prev) => ({
              ...prev,
              userId: user?.userId ?? 0,
            }));
          }}
          renderItem={(item) => (
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900">
                {item.fullName}
              </span>
            </div>
          )}
          displayValue={(user) => user.fullName}
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
          onClick={handleAddISRPurchaser}
          loading={isSubmitting}
          disabled={isSubmitting || form.userId === 0}
        />
      </div>
    </div>
  );
};

export default AddPurchaserISR;
