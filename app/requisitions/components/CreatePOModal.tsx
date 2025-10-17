import Button from "@/components/shared/Button";
import Table, { Column } from "@/components/shared/Table";
import {
  CreatePurchaseOrderFormDto,
  CreatePurchaseOrderItemDto,
} from "@/dtos/purchase.dto";
import {
  DisplayRequestItems,
  DisplayRequestOrderDto,
  DisplayTotalOrderItem,
  DisplayGroupedRequestItem,
} from "@/dtos/request.dto";
import { UserAuth } from "@/hooks/useSession";
import { fetcher } from "@/utils/fetcher";
import { XCircle, ClipboardCheck, Send } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import useSWR from "swr";

interface CreatePOModalPros {
  data: DisplayRequestOrderDto[];
  user: UserAuth | null;
  onCancel: () => void;
  onSubmit: (items: CreatePurchaseOrderFormDto) => Promise<boolean>;
}

const requestItemColumn: Column<DisplayTotalOrderItem>[] = [
  { name: "Item ID", key: "itemId" },
  { name: "Item Name", key: "itemName" },
  { name: "Unit", key: "itemUnit" },
  { name: "Price", key: "itemPrice" },
  { name: "Stock Available", key: "stockItem" },
  { name: "Quantity Requested", key: "totalQuantity" },
  {
    name: "Need to Order",
    key: "orderNeed",
    selector: (row) => row.stockItem - row.totalQuantity,
  },
  {
    name: "Quantity to Order",
    key: "poItemOrder",
    editable: true,
    inputType: "number",
  },
];

const CreatePOModal: React.FC<CreatePOModalPros> = ({
  data,
  user,
  onCancel,
  onSubmit,
}) => {
  const [orderItem, setOrderItem] = useState<DisplayTotalOrderItem[]>([]);

  const {
    data: itemResponse = { data: [] },
    isLoading: loading,
    mutate,
  } = useSWR<{ data: DisplayGroupedRequestItem[] }>(
    user
      ? `/api/requests/request-items-total?ids=${data
          .map((item) => item.requestId)
          .join(",")}`
      : null,
    fetcher
  );
  useEffect(() => {
    if (itemResponse.data) {
      const newData: DisplayTotalOrderItem[] = itemResponse.data.map(
        (item) => ({
          ...item,
          reqItemStock: 0,
          poItemOrder: 0,
        })
      );
      setOrderItem(newData);
    }
  }, [itemResponse.data?.length]);

  const handleSubmit = async () => {
    const purchaseItems: CreatePurchaseOrderItemDto[] = orderItem.map(
      (item) => ({
        poId: 0,
        poItemReceivedQty: 0,
        poItemOrderedQty: item.poItemOrder,
        itemId: item.itemId,
        unitPrice: item.itemPrice,
      })
    );
    const purchaseFormData: CreatePurchaseOrderFormDto = {
      poCreatedBy: user?.userId ?? 0,
      poDescription: "",
      poNumber: "",
      purchaseOrderItems: purchaseItems,
      purchaseOrderRequest: data.map((req) => ({
        requestId: req.requestId,
        poId: 0,
      })),
    };
    const success = await onSubmit(purchaseFormData);
    if (success) {
    }
  };

  const handleFillUpAll = () => {
    setOrderItem((prev) =>
      prev.map((item) => ({
        ...item,
        poItemOrder: item.totalQuantity - item.stockItem, // 👈 copy totalQuantity
      }))
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="">
        <Table
          isRounded={false}
          columns={requestItemColumn}
          data={orderItem}
          loading={loading}
        />
      </div>
      <div className="border-t border-gray-300 p-4 flex justify-end">
        <div className="flex gap-2">
          <div>
            {" "}
            <Button
              label="Cancel"
              onClick={onCancel}
              color="secondary"
              size="sm"
              icon={<XCircle className="w-4 h-4" />} // ❌ Cancel icon
            />
          </div>

          <div>
            <Button
              label="Fillup Order"
              onClick={handleFillUpAll}
              color="success"
              size="sm"
              icon={<ClipboardCheck className="w-4 h-4" />} // ✅ Fillup icon
            />
          </div>

          <div>
            <Button
              label="Submit"
              onClick={handleSubmit}
              size="sm"
              icon={<Send className="w-4 h-4" />} // 📤 Submit icon
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePOModal;
