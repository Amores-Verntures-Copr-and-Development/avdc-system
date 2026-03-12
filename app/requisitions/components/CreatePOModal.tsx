import Button from "@/components/shared/Button";
import IconButton from "@/components/shared/IconButton";
import Popup from "@/components/shared/Popup";
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
import { XCircle, ClipboardCheck, Send, RefreshCcw } from "lucide-react";
import React, { useEffect, useState } from "react";
import useSWR from "swr";
import ConvertSideModal from "./ConvertSideModal";
import { DisplayItemConversionFromTo } from "@/dtos/items.dto";

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
  const [selectedConvert, setSelectedConvert] =
    useState<DisplayTotalOrderItem | null>(null);
  const [orderItem, setOrderItem] = useState<DisplayTotalOrderItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    {
      name: "#",
      key: "#",
      selector: (_row, index) => (
        <span className=" flex justify-center">{index + 1}</span>
      ),
    },
    {
      name: "Item Name",
      key: "itemName",
      selector: (row) => (
        <span className=" flex justify-center">{row.itemName}</span>
      ),
    },
    {
      name: "Unit",
      key: "itemUnit",
      selector: (row) => (
        <span className=" flex justify-center">{row.itemUnit}</span>
      ),
    },
    {
      name: "Price",
      key: "itemPrice",
      selector: (row) => (
        <span className=" flex justify-center">
          {formatPeso(row.itemPrice)}
        </span>
      ),
    },
    {
      name: "Stock Available",
      key: "stockItem",
      selector: (row) => (
        <span className="font-semibold flex justify-center">
          {formatQuantityByUnit(row.stockItem, row.itemUnit)}
        </span>
      ),
      bgCol: "bg-green-100",
      bgHeader: "bg-green-200",
    },
    {
      name: "Quantity Requested",
      key: "totalQuantity",
      selector: (row) => (
        <span className="font-semibold flex justify-center">
          {formatQuantityByUnit(row.totalQuantity, row.itemUnit)}
        </span>
      ),
      bgCol: "bg-blue-100",
      bgHeader: "bg-greeblue-200",
    },
    {
      name: "Need to Order",
      key: "orderNeed",
      selector: (row) => {
        // const isGreater = Number(row.stockItem) > Number(row.totalQuantity);

        if (Number(row.stockItem) >= Number(row.totalQuantity)) {
          return (
            <div className="w-full">
              {" "}
              <span className="bg-green-600 py-1 rounded-2xl px-2 flex justify-center text-white">
                Avail ({row.stockItem - row.totalQuantity})
              </span>
            </div>
          );
        } else {
          const quantity = row.stockItem - row.totalQuantity; // Fixed: should be total - stock
          return (
            <span className="text-red-600 flex justify-center font-medium">
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
      selector: (row: any) => (
        <span className="flex justify-center">
          {formatQuantityByUnit(row[key], row.itemUnit)}
        </span>
      ),
    }));
  const requestItemColumn: Column<DisplayTotalOrderItem>[] = [
    ...baseColumns.slice(0, 5), // before totals
    ...storeColumns, // dynamically added per store
    ...baseColumns.slice(5), // totals and editable fields
  ];
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const purchaseItems: CreatePurchaseOrderItemDto[] = orderItem
        .filter((i) => Number(i.poItemOrder) !== 0)
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
        onCancel();
      }
    } catch (e) {
      throw e;
    } finally {
      setIsSubmitting(false);
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
  const handleConvert = (
    conversion: DisplayItemConversionFromTo,
    quantity: number,
    convertedFrom: DisplayTotalOrderItem | null,
  ) => {
    if (!convertedFrom) return;

    const convertOrderItem: DisplayTotalOrderItem = {
      itemId: conversion.toItemId,
      itemName: conversion.fromItemName ?? "",
      itemUnit: conversion.toUnit,
      itemPrice: conversion.fromItemPrice,
      totalQuantity: Number(quantity),
      totalReceived: 0,
      stockItem: 0,
      poItemOrder: Number(quantity),
      orderNeed: Number(quantity),
    };

    setOrderItem((prev) => {
      const findReplaceItems = prev.find(
        (i) => i.itemId === convertedFrom.itemId,
      );

      const itemsWithoutConvertedFrom = prev.filter(
        (i) => i.itemId !== convertedFrom.itemId,
      );

      const existing = itemsWithoutConvertedFrom.find(
        (i) => i.itemId === convertOrderItem.itemId,
      );

      const conversionRate = Number(conversion.fromQuantity ?? 1);

      if (existing && findReplaceItems) {
        // create a new array with updated quantities
        return itemsWithoutConvertedFrom.map((i) => {
          if (i.itemId !== convertOrderItem.itemId) return i;

          const updated: any = { ...i };

          // dynamically update all *_Qty fields
          Object.keys(findReplaceItems).forEach((key) => {
            if (key.endsWith("_Qty")) {
              const fromQty = Number((findReplaceItems as any)[key] ?? 0);
              const existingQty = Number((i as any)[key] ?? 0);
              updated[key] = (existingQty + fromQty / conversionRate).toFixed(
                2,
              );
            }
          });

          // also update totalQuantity
          updated.totalQuantity =
            Number(i.totalQuantity) + Number(convertOrderItem.totalQuantity);

          return updated;
        });
      }

      // if not existing, add the new converted item
      return [...itemsWithoutConvertedFrom, convertOrderItem];
    });

    // ✅ Toast outside of setState updater

    setSelectedConvert(null);
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
          showActions
          renderActions={(row) => (
            <div className="flex justify-center">
              <IconButton
                onClick={function (): void {
                  setSelectedConvert(row);
                }}
                label={"Convert"}
                bg={"green"}
                icon={<RefreshCcw className="w-3 h-3" />}
              />
            </div>
          )}
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
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Button
              label="Submit"
              onClick={handleSubmit}
              size="sm"
              icon={Send}
              loading={isSubmitting}
            />
          </div>
        </div>
      </div>
      <Popup
        isOpen={selectedConvert !== null}
        onClose={function (): void {
          setSelectedConvert(null);
        }}
        title="Convert PO Item"
        background="bg-white/25"
      >
        <ConvertSideModal data={selectedConvert} onConvert={handleConvert} />
      </Popup>
    </div>
  );
};

export default CreatePOModal;
