import BigCard from "@/components/shared/BigCard";
import Button from "@/components/shared/Button";
import DropDownSearchItem from "@/components/shared/DropDownSearchItem";
import IconButton from "@/components/shared/IconButton";
import Input from "@/components/shared/Input";
import {
  CreateOrderCompositeItemDro,
  DisplayPurchaseOrderItemsDto,
} from "@/dtos/purchase.dto";
import { useSession } from "@/hooks/useSession";
import { ItemInterface } from "@/types/items";
import { formatPeso } from "@/utils/formatPeso";

import { Trash } from "lucide-react";
import React, { useState } from "react";
import toast from "react-hot-toast";

interface AddCompositeItemProps {
  data: DisplayPurchaseOrderItemsDto | null;
  onCancel: () => void;
  mutate: () => void;
}

const AddCompositeItem = ({
  onCancel,
  data,
  mutate,
}: AddCompositeItemProps) => {
  const { user } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectType, setSelectType] = useState<"search" | "conversion">(
    "search",
  );
  const [orderCompItems, setOrderCompItems] = useState<
    CreateOrderCompositeItemDro[]
  >([]);
  const [selectedItem, setSelectedItem] = useState<ItemInterface[]>([]);
  const addItem = (itemId: number, price: number) => {
    setOrderCompItems((prev) => {
      const exist = orderCompItems.find((i) => i.itemId === itemId);

      if (exist) {
        toast.error("Item is already added to list!");
        return prev;
      }
      return [
        ...prev,
        {
          itemId: itemId,
          ordComCreatedBy: user?.userId ?? 0,
          ordComPrice: Number(price),
          ordComQuantity: 0,
          poItemId: data?.poItemId ?? 0,
          reqItemId: 0,
        },
      ];
    });
  };
  const removeItem = (itemId: number) => {
    setOrderCompItems((prev) => {
      return prev.filter((i) => i.itemId !== itemId);
    });
    setSelectedItem((prev) => {
      return prev.filter((i) => i.itemId !== itemId);
    });
  };
  const onChangeValue = (
    index: number,
    field: "ordComQuantity" | "ordComPrice",
    value: number,
  ) => {
    setOrderCompItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  };
  const hasNoData = orderCompItems.length === 0;
  const handleAddComposite = async () => {
    const hasNoQuantity = orderCompItems.some(
      (i) => Number(i.ordComQuantity) === 0,
    );
    if (hasNoQuantity) {
      toast.error("Quantity is required!");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await fetch(
        `/api/purchase-order/${data?.poId}/${data?.poItemId}/composite-item`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(orderCompItems),
        },
      );
      const res = await result.json();
      if (!res.success) {
        throw new Error(res.error);
      }
      toast.success(res.message);
      mutate();
      onCancel();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="flex flex-col h-full gap-3 overflow-vissible">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">Select Item from:</span>
        <div className="flex gap-2">
          <div>
            <Button
              label="Search"
              size="xs"
              color={selectType === "search" ? "primary" : "secondary"}
              onClick={() => {
                setSelectType("search");
              }}
              hasBorder={false}
            />
          </div>
          <div>
            <Button
              label="Conversion"
              size="xs"
              color={selectType === "conversion" ? "primary" : "secondary"}
              onClick={() => {
                setSelectType("conversion");
              }}
              hasBorder={false}
            />
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-vissible">
        {selectType === "search" ? (
          <BigCard title={"Search Item"} isRounded={false}>
            <div className="flex">
              <DropDownSearchItem
                onSelect={function (item: ItemInterface): void {
                  if (item) {
                    setSelectedItem((prev) => {
                      const exist = selectedItem.find(
                        (i) => i.itemId === item.itemId,
                      );

                      if (exist) {
                        return prev;
                      }
                      return [...prev, item];
                    });
                    addItem(item.itemId, item.itemPrice);
                  }
                }}
                sizes="xs"
                onQueryChange={() => {
                  console.log("Test");
                }}
              />
            </div>
          </BigCard>
        ) : (
          <BigCard title={"Select Item Conversion"} isRounded={false}>
            <div></div>
          </BigCard>
        )}
      </div>
      <BigCard title="Composite Item" isRounded={false}>
        <div className="flex flex-col gap-2">
          {orderCompItems.map((comp, index) => {
            const item = selectedItem.find((i) => i.itemId === comp.itemId);

            return (
              <div
                key={comp.itemId}
                className="flex items-center gap-4 p-2 border-b border-gray-200"
              >
                <span className="w-5 text-xs text-gray-600">{index + 1}</span>

                <div className="flex flex-col w-32">
                  <span className="text-xs font-medium">{item?.itemName}</span>
                  <span className="text-xs text-gray-500">
                    {item?.itemUnit}
                  </span>
                  <span className="text-xs text-gray-500 font-semibold">
                    {formatPeso(item?.itemPrice)}
                  </span>
                </div>

                <div className="flex flex-col w-24">
                  <span className="text-xs text-gray-500">Quantity</span>
                  <Input
                    label=""
                    sizes="xs"
                    value={comp.ordComQuantity === 0 ? "" : comp.ordComQuantity}
                    name="ordComQuantity"
                    onChange={(e) =>
                      onChangeValue(
                        index,
                        "ordComQuantity",
                        Number(e.target.value),
                      )
                    }
                  />
                </div>

                <div className="flex flex-col w-24">
                  <span className="text-xs text-gray-500">Price</span>
                  <Input
                    label=""
                    name="ordComPrice"
                    sizes="xs"
                    value={comp.ordComPrice === 0 ? "" : comp.ordComPrice}
                    onChange={(e) =>
                      onChangeValue(
                        index,
                        "ordComPrice",
                        Number(e.target.value),
                      )
                    }
                    type="number"
                  />
                </div>

                <IconButton
                  onClick={() => {
                    if (item?.itemId) removeItem(item.itemId);
                  }}
                  label="remove"
                  bg="red"
                  icon={<Trash className="w-3 h-3" />}
                />
              </div>
            );
          })}
        </div>
      </BigCard>
      <div className="mt-auto justify-end flex gap-2">
        <div>
          <Button
            label="Cancel"
            size="sm"
            color="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          />
        </div>
        <div>
          <Button
            label="Add Composite"
            size="sm"
            onClick={handleAddComposite}
            disabled={hasNoData}
            loading={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
};

export default AddCompositeItem;
