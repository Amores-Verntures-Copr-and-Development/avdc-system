import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import { DisplayRequestOrderDto } from "@/dtos/request.dto";
import { Request } from "@/types/request";
import { Save, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface EditRequestDescriptionProps {
  data: DisplayRequestOrderDto | null;
  mutate: () => void;
  onClose: () => void;
}

const EditRequestDescription = ({
  data,
  mutate,
  onClose,
}: EditRequestDescriptionProps) => {
  useEffect(() => {
    if (data) {
      setDescription(data.requestDesc);
    }
  }, [data]);
  const [description, setDescription] = useState(data?.requestDesc);
  const [isLoading, setIsLoading] = useState(false);
  const handleEditDescription = async () => {
    setIsLoading(true);
    try {
      const editDesRO: Partial<Request> = {
        requestId: data?.requestId,
        requestDesc: description,
      };

      const res = await fetch(`/api/requests/${data?.requestId}`, {
        method: "PATCH",
        body: JSON.stringify(editDesRO),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await res.json();

      if (!result.success) {
        throw new Error(result.messsage);
      }
      toast.success(result.message);
      mutate();
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="flex flex-col gap-3">
      <Input
        sizes={"sm"}
        label={"Description"}
        value={description ?? ""}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div className="flex  justify-end gap-3">
        <div>
          <Button
            label="Cancel"
            size="sm"
            color="outline"
            icon={X}
            onClick={onClose}
            disabled={isLoading}
          />
        </div>
        <div>
          <Button
            label="Save"
            size="sm"
            icon={Save}
            onClick={handleEditDescription}
            loading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default EditRequestDescription;
