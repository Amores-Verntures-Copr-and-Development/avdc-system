import BigCard from "@/components/shared/BigCard";
import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";

import { CreateDiscountDto } from "@/dtos/discounts.dto";
import { UserAuth } from "@/hooks/useSession";
import { Discounts } from "@/types/discount";
import { fetcher } from "@/utils/fetcher";
import { formatPeso } from "@/utils/formatPeso";
import { handleChange } from "@/utils/handle-change";
import React, { useState } from "react";
import toast from "react-hot-toast";
import useSWR from "swr";

interface DiscountListProps {
  storeId: number | null;
  user: UserAuth | null;
}

const DiscountList = ({ storeId, user }: DiscountListProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [discountForm, setDiscountForm] = useState<CreateDiscountDto>({
    storeId: 0,
    discountName: "",
    discountValue: 0,
    discountCreatedBy: 0,
    discountType: "percent",
  });
  const {
    data: itemResponse = { data: [] },

    mutate,
  } = useSWR<{
    data: Discounts[];
  }>(storeId ? `/api/sales-discount/store/${storeId}/` : null, fetcher);
  const handleDiscountChange = handleChange(discountForm, setDiscountForm);
  const handleClearForm = () => {
    setDiscountForm({
      storeId: 0,
      discountName: "",
      discountValue: 0,
      discountCreatedBy: 0,
      discountType: "percent",
    });
  };
  const handCreateDiscount = async () => {
    if (!discountForm.discountName || discountForm.discountName === "") {
      toast.error("Discount name is required!");
      return;
    }
    if (!discountForm.discountValue || discountForm.discountValue === 0) {
      toast.error("Discount value is required!");
      return;
    }
    if (!user || user?.userId === 0) {
      toast.error("No user found!");
      return;
    }
    if (!storeId || storeId === 0) {
      toast.error("No user found!");
      return;
    }
    const discountNewForm: CreateDiscountDto = {
      ...discountForm,
      discountCreatedBy: user?.userId,
      storeId: storeId,
    };

    try {
      const result = await fetch(
        `/api/sales-discount/store/${discountNewForm.storeId}/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(discountNewForm),
        },
      );
      const res = await result.json();
      if (!res.success) {
        throw new Error(res.error);
      }
      mutate();
      handleClearForm();
      toast.success(res.message);
      return true;
    } catch (e: any) {
      toast.error(e?.message || "Failed to create discounts");
      return false;
    } finally {
      setIsAdding(false);
    }
  };
  return (
    <div className="flex flex-col gap-2">
      <BigCard title={"Create Discount"} isRounded={false}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Input
              label="Name"
              sizes={"xs"}
              value={discountForm.discountName}
              name="discountName"
              onChange={handleDiscountChange}
            />
            <Input
              label="Value"
              sizes={"xs"}
              type="number"
              value={discountForm.discountValue || ""}
              name="discountValue"
              onChange={handleDiscountChange}
            />
            <label className="text-[10px] xl:text-xs font-semibold text-gray-700">
              Discount Type
            </label>
            <div className="flex gap-2">
              <div>
                {" "}
                <Button
                  label={`${discountForm.discountValue || 0}% off`}
                  size="xs"
                  color={
                    discountForm.discountType === "percent"
                      ? "primary"
                      : "secondary"
                  }
                  onClick={() => {
                    setDiscountForm((prev) => ({
                      ...prev,
                      discountType: "percent",
                    }));
                  }}
                />
              </div>
              <div>
                {" "}
                <Button
                  label={`${formatPeso(discountForm.discountValue || 0)}  off`}
                  size="xs"
                  color={
                    discountForm.discountType === "fixed"
                      ? "primary"
                      : "secondary"
                  }
                  onClick={() => {
                    setDiscountForm((prev) => ({
                      ...prev,
                      discountType: "fixed",
                    }));
                  }}
                />
              </div>
            </div>
          </div>
          <div className="flex mt-auto justify-end gap-4">
            <div>
              <Button
                label="Clear"
                size="xs"
                color="secondary"
                hasBorder
                onClick={handleClearForm}
                disabled={isAdding}
              />
            </div>
            <div>
              <Button
                label="Create"
                size="xs"
                color="primary"
                hasBorder
                onClick={handCreateDiscount}
                loading={isAdding}
              />
            </div>
          </div>
        </div>
      </BigCard>
      <BigCard title={"Payment Method List"} isRounded={false}>
        <div className="flex flex-col gap-2">
          {itemResponse.data && itemResponse.data.length > 0 ? (
            itemResponse.data.map((dis) => (
              <SalesDiscountCard key={dis.discountId} data={dis} />
            ))
          ) : (
            <div></div>
          )}
        </div>
      </BigCard>
    </div>
  );
};

export default DiscountList;

const SalesDiscountCard = ({ data }: { data: Discounts }) => {
  return (
    <div className="flex items-center justify-between gap-4 p-3 border border-gray-200 rounded-md hover:bg-gray-50">
      {/* Left */}
      <div className="flex flex-col">
        <span className="text-sm font-semibold">{data.discountName}</span>
        <span className="text-xs text-gray-500">{data.discountType}</span>
      </div>

      {/* Middle */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          {data.discountType === "percent"
            ? `${formatDiscountValue(Number(data.discountValue))}%`
            : `₱${data.discountValue}`}
        </span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span>{new Date(data.discountCreatedAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
};

export const formatDiscountValue = (value: number) => {
  return value % 1 === 0
    ? value.toString() // 10.00 → "10"
    : value.toFixed(2).replace(/\.?0+$/, ""); // 10.50 → "10.5"
};
