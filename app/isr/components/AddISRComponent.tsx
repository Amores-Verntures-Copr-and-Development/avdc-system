import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import { CreateISRDto } from "@/dtos/isr.dto";
import { useSession } from "@/hooks/useSession";
import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import toast from "react-hot-toast";

interface AddISRComponentProps {
  mutate: () => void;
  onCancel: () => void;
}

const AddISRComponent = ({ onCancel }: AddISRComponentProps) => {
  const router = useRouter();
  const { user } = useSession();
  const [form, setForm] = useState<CreateISRDto>({
    isrCode: "",
    isrName: "",
    isrCreatedBy: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      if (!user) {
        toast.error("You must be logged in to add an ISR.");
        return;
      }

      const payload: CreateISRDto = {
        ...form,
        isrCreatedBy: user.userId,
      };

      const res = await fetch("/api/isr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.message || "Failed to create ISR.");
        return;
      }

      toast.success("ISR created successfully!");

      router.push(`/isr/${result.data.isrCode}`);
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Input
        label={"Name"}
        sizes="sm"
        onChange={(e) => setForm({ ...form, isrName: e.target.value })}
        value={form.isrName}
        name="isrName"
      />
      <div className="mt-auto flex justify-end gap-2">
        <div>
          <Button
            label="Cancel"
            onClick={() => {}}
            size="sm"
            color="secondary"
            icon={X}
            disabled={isSubmitting}
          />
        </div>
        <div>
          <Button
            label="Add ISR"
            onClick={handleSubmit}
            size="sm"
            icon={Plus}
            loading={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
};

export default AddISRComponent;
