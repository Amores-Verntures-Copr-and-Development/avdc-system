import Button from "@/components/shared/Button";
import { DropdownSearch } from "@/components/shared/DropDownSearch";
import { CreateISRRequestHandlerDto } from "@/dtos/isr.dto";
import { DisplayUserDto } from "@/dtos/user.dto";
import { useSession } from "@/hooks/useSession";
import { InterStoreRequests } from "@/types/isr";
import React, { useState } from "react";
import toast from "react-hot-toast";

interface AddReceiverISRProps {
  data: InterStoreRequests;
  onClose: () => void;
  mutate: () => void;
}

const AddReceiverISR = ({ data, onClose, mutate }: AddReceiverISRProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState<CreateISRRequestHandlerDto>({
    isrId: 0,
    isrReqHanCreatedBy: 0,
    userId: 0,
  });
  const { user } = useSession();

  const searchUser = async (query: string): Promise<DisplayUserDto[]> => {
    const res = await fetch(
      `/api/isr/${data.isrCode}/request-handler/not-in?search=${encodeURIComponent(query)}`,
    );
    const json = await res.json();
    return json.data || [];
  };
  const handleAddISRRequestHandler = async () => {
    setIsSubmitting(true);
    try {
      if (!user) {
        toast.error("User is required to perform this action!");
        return;
      }

      const body: CreateISRRequestHandlerDto = {
        ...form,
        isrReqHanCreatedBy: user?.userId,
        isrId: data.isrId,
      };

      const res = await fetch(`/api/isr/${data.isrCode}/request-handler`, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await res.json();
      if (!result.success) {
        toast.error("Failed to add request handler!");
        return;
      }

      toast.success("Request Handler added to ISR successfully!");
      mutate();
      onClose();
    } catch (e) {
      toast.error("Failed to add request handler!");
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
              Assign Receiver
            </p>

            <p className="mt-1 text-xs leading-5 text-blue-700">
              This user will be assigned as the receiver for this ISR and will
              be responsible for processing store request items.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-500">
          Select Request Receiver
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
          onClick={handleAddISRRequestHandler}
          loading={isSubmitting}
          disabled={isSubmitting || form.userId === 0}
        />
      </div>
    </div>
  );
};

export default AddReceiverISR;
