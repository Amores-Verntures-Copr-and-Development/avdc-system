import Button from "@/components/shared/Button";
import Table, { Column } from "@/components/shared/Table";
import {
  CreatePurchaseOrderFormDto,
  CreatePurchaseOrderItemDto,
} from "@/dtos/purchase.dto";
import {
  DisplayRequestOrderDto,
  DisplayTotalOrderItem,
  DisplayGroupedRequestItem,
} from "@/dtos/request.dto";
import { UserAuth } from "@/hooks/useSession";
import { fetcher } from "@/utils/fetcher";
import { formatPeso } from "@/utils/formatPeso";
import { formatQuantityByUnit } from "@/utils/formatQuantityByUnit";
import { XCircle, ClipboardCheck, Send } from "lucide-react";
import React, { useEffect, useState } from "react";
import useSWR from "swr";

interface CreatePOModalPros {
  data: DisplayRequestOrderDto[];
  user: UserAuth | null;
  onCancel: () => void;
  onSubmit: (items: CreatePurchaseOrderFormDto) => Promise<boolean>;
}

const CreatePOModal: React.FC<CreatePOModalPros> = ({
  data,
  user,
  onCancel,
  onSubmit,
}) => {
  const [orderItem, setOrderItem] = useState<DisplayTotalOrderItem[]>([]);

  const { data: itemResponse = { data: [] }, isLoading: loading } = useSWR<{
    data: DisplayGroupedRequestItem[];
  }>(
    user
      ? `/api/requests/request-items-total?ids=${data
          .map((item) => item.requestId)
          .join(",")}`
      : null,
    fetcher,
  );
  useEffect(() => {
    console.log("ASD", { orderItem });
    if (itemResponse.data) {
      const newData: DisplayTotalOrderItem[] = itemResponse.data.map(
        (item) => ({
          ...item,
          reqItemStock: 0,
          poItemOrder: 0,
        }),
      );
      setOrderItem(newData);
    }
  }, [itemResponse.data?.length]);

  const baseColumns: Column<DisplayTotalOrderItem>[] = [
    { name: "#", key: "#", selector: (_row, index) => index + 1 },
    { name: "Item Name", key: "itemName" },
    { name: "Unit", key: "itemUnit" },
    {
      name: "Price",
      key: "itemPrice",
      selector: (row) => formatPeso(row.itemPrice),
    },
    {
      name: "Stock Available",
      key: "stockItem",
      selector: (row) => formatQuantityByUnit(row.stockItem, row.itemUnit),
    },
    {
      name: "Quantity Requested",
      key: "totalQuantity",
      selector: (row) => formatQuantityByUnit(row.totalQuantity, row.itemUnit),
    },
    {
      name: "Need to Order",
      key: "orderNeed",
      selector: (row) => {
        console.log("Stock Item: ", row.stockItem);
        console.log("Total Quantity: ", row.totalQuantity);
        // const isGreater = Number(row.stockItem) > Number(row.totalQuantity);

        if (Number(row.stockItem) >= Number(row.totalQuantity)) {
          return (
            <div className="w-full">
              {" "}
              <span className="bg-green-600 py-1 rounded-2xl px-2 text-white">
                Avail ({row.stockItem - row.totalQuantity})
              </span>
            </div>
          );
        } else {
          const quantity = row.stockItem - row.totalQuantity; // Fixed: should be total - stock
          return (
            <span className="text-red-600 font-medium">
              {formatQuantityByUnit(quantity, row.itemUnit)}
            </span>
          );
        }
      },
    },
    {
      name: "Quantity to Order",
      key: "poItemOrder",
      editable: true,
      inputType: "number",
    },
  ];
  const dataKeys = Object.keys(itemResponse.data?.[0] || {});
  const storeColumns = dataKeys
    .filter((key) => key.endsWith("_Qty"))
    .map((key) => ({
      name: key.replace(/_/g, " ").replace("Qty", "Qty").trim(),
      key,
      selector: (row: any) => formatQuantityByUnit(row[key], row.itemUnit),
    }));
  console.log("Store Columns: ", storeColumns);
  const requestItemColumn: Column<DisplayTotalOrderItem>[] = [
    ...baseColumns.slice(0, 5), // before totals
    ...storeColumns, // dynamically added per store
    ...baseColumns.slice(5), // totals and editable fields
  ];
  const handleSubmit = async () => {
    const purchaseItems: CreatePurchaseOrderItemDto[] = orderItem
      .filter((i) => i.poItemOrder !== 0)
      .map((item) => ({
        poId: 0,
        poItemReceivedQty: 0,
        poItemOrderedQty: item.poItemOrder,
        itemId: item.itemId,
        unitPrice: item.itemPrice,
      }));

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
      prev.map((item) => {
        const totalQty = Number(item.totalQuantity);
        const stockQty = Number(item.stockItem);

        return {
          ...item,
          poItemOrder: totalQty > stockQty ? totalQty - stockQty : 0,
        };
      }),
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable Table Section */}
      <div className="flex-1 overflow-y-auto p-4">
        <Table
          uniqueIdKey="itemId"
          isRounded={false}
          columns={requestItemColumn}
          data={orderItem}
          loading={loading}
          maxHeight="h-full"
          updateData={setOrderItem}
        />
      </div>

      {/* Fixed Footer at Bottom */}
      <div className="border-t border-gray-300 p-4 flex justify-end bg-white sticky bottom-0">
        <div className="flex gap-2">
          <div>
            {" "}
            <Button
              label="Cancel"
              onClick={onCancel}
              color="secondary"
              size="sm"
              icon={XCircle}
            />
          </div>

          <div>
            <Button
              label="Fillup Order"
              onClick={handleFillUpAll}
              color="success"
              size="sm"
              icon={ClipboardCheck}
            />
          </div>

          <div>
            <Button
              label="Submit"
              onClick={handleSubmit}
              size="sm"
              icon={Send}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePOModal;
