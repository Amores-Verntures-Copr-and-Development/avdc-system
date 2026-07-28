"use client";

import Button from "@/components/shared/Button";
import DropdownSelect from "@/components/shared/DropdownSelect";
import Modal from "@/components/shared/Modal";
import { ApiResponse } from "@/types/api";
import { DisplayOrderItemDto } from "@/dtos/orders.dto";
import { OrderItemStatus, OrderStatus, Orders } from "@/types/orders";
import { fetcher } from "@/utils/fetcher";
import { formatDateToWords } from "@/utils/formatDateToWords";
import { formatPeso } from "@/utils/formatPeso";
import { ArrowRight, Ban, Package, Truck } from "lucide-react";
import React, { useMemo, useState } from "react";
import toast from "react-hot-toast";
import useSWR from "swr";

const COLUMNS: { status: OrderStatus; label: string }[] = [
  { status: "PENDING", label: "Pending" },
  { status: "CONFIRMED", label: "Confirmed" },
  { status: "PREPARING", label: "Preparing" },
  { status: "READY_FOR_PICKUP", label: "Ready for Pickup" },
  { status: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
  { status: "COMPLETED", label: "Completed" },
  { status: "CANCELLED", label: "Cancelled" },
];

const nextStatus = (order: Orders): OrderStatus | null => {
  switch (order.orderStatus) {
    case "PENDING":
      return "CONFIRMED";
    case "CONFIRMED":
      return "PREPARING";
    case "PREPARING":
      return order.fulfillmentType === "DELIVERY"
        ? "OUT_FOR_DELIVERY"
        : "READY_FOR_PICKUP";
    case "READY_FOR_PICKUP":
    case "OUT_FOR_DELIVERY":
      return "COMPLETED";
    default:
      return null;
  }
};

const itemStatusOptions: { label: string; value: OrderItemStatus }[] = [
  { label: "Pending", value: "PENDING" },
  { label: "Fulfilled", value: "FULFILLED" },
  { label: "Out of Stock", value: "OUT_OF_STOCK" },
  { label: "Substituted", value: "SUBSTITUTED" },
];

interface OrderKanbanViewProps {
  storeId: number | null;
}

const OrderKanbanView = ({ storeId }: OrderKanbanViewProps) => {
  const [selectedOrder, setSelectedOrder] = useState<Orders | null>(null);

  const {
    data: response = { success: true, message: "", data: [] },
    mutate,
    isLoading,
  } = useSWR<ApiResponse<Orders[]>>(
    storeId ? `/api/order/${storeId}?limit=200` : null,
    fetcher,
    { refreshInterval: 15000 },
  );

  const {
    data: itemResponse = { data: [] },
    mutate: mutateItems,
    isLoading: isItemsLoading,
  } = useSWR<{ data: DisplayOrderItemDto[] }>(
    storeId && selectedOrder
      ? `/api/order/${storeId}/${selectedOrder.orderId}/items`
      : null,
    fetcher,
  );

  const ordersByStatus = useMemo(() => {
    const map: Record<string, Orders[]> = {};
    for (const column of COLUMNS) {
      map[column.status] = [];
    }
    for (const order of response.data ?? []) {
      if (map[order.orderStatus]) {
        map[order.orderStatus].push(order);
      }
    }
    return map;
  }, [response.data]);

  const handleUpdateOrderStatus = async (
    order: Orders,
    orderStatus: OrderStatus,
  ) => {
    if (!storeId) return;

    try {
      const result = await fetch(`/api/order/${storeId}/${order.orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderStatus }),
      });
      const res = await result.json();
      if (!res.success) {
        throw new Error(res.message);
      }
      toast.success(`Order ${order.orderNumber} moved to ${orderStatus}`);
      mutate();
      setSelectedOrder((prev) =>
        prev && prev.orderId === order.orderId
          ? { ...prev, orderStatus }
          : prev,
      );
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleUpdateItemStatus = async (
    orderItemId: number,
    itemStatus: OrderItemStatus,
  ) => {
    if (!storeId || !selectedOrder) return;

    try {
      const result = await fetch(
        `/api/order/${storeId}/${selectedOrder.orderId}/items/${orderItemId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemStatus }),
        },
      );
      const res = await result.json();
      if (!res.success) {
        throw new Error(res.message);
      }
      toast.success("Item updated!");
      mutateItems();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="flex-1 min-h-0 overflow-x-auto">
        <div className="flex gap-3 h-full min-w-max pb-2">
          {COLUMNS.map((column) => {
            const orders = ordersByStatus[column.status] ?? [];
            return (
              <div
                key={column.status}
                className="w-72 flex-shrink-0 flex flex-col bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700">
                    {column.label}
                  </span>
                  <span className="text-[10px] font-semibold text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                    {orders.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
                  {isLoading && (
                    <p className="text-xs text-gray-400 text-center py-4">
                      Loading...
                    </p>
                  )}

                  {!isLoading && orders.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-4">
                      No orders
                    </p>
                  )}

                  {orders.map((order) => {
                    const next = nextStatus(order);
                    return (
                      <div
                        key={order.orderId}
                        className="bg-white rounded-md border border-gray-200 p-3 flex flex-col gap-2 cursor-pointer hover:shadow-sm"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-800">
                            {order.orderNumber}
                          </span>
                          {order.fulfillmentType === "DELIVERY" ? (
                            <Truck className="w-4 h-4 text-purple-500" />
                          ) : (
                            <Package className="w-4 h-4 text-blue-500" />
                          )}
                        </div>

                        <p className="text-xs text-gray-500">
                          {formatDateToWords(order.orderCreatedAt)}
                        </p>

                        <p className="text-xs font-semibold text-gray-700">
                          {formatPeso(order.totalAmount)}
                        </p>

                        <div className="flex gap-2 pt-1">
                          {next && (
                            <Button
                              size="xs"
                              color="primary"
                              icon={ArrowRight}
                              label={next.replaceAll("_", " ")}
                              onClick={() =>
                                handleUpdateOrderStatus(order, next)
                              }
                            />
                          )}
                          {order.orderStatus !== "COMPLETED" &&
                            order.orderStatus !== "CANCELLED" && (
                              <Button
                                size="xs"
                                color="danger"
                                icon={Ban}
                                label=""
                                onClick={() =>
                                  handleUpdateOrderStatus(order, "CANCELLED")
                                }
                              />
                            )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Modal
        title={selectedOrder?.orderNumber ?? "Order"}
        size="lg"
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
      >
        {selectedOrder && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md border border-gray-200 p-3">
                <span className="text-xs text-gray-500">Fulfillment</span>
                <p className="mt-1 text-sm font-semibold">
                  {selectedOrder.fulfillmentType}
                  {selectedOrder.deliveryAddress
                    ? ` — ${selectedOrder.deliveryAddress}`
                    : ""}
                </p>
              </div>

              <div className="rounded-md border border-gray-200 p-3">
                <span className="text-xs text-gray-500">Order Status</span>
                <DropdownSelect
                  name="orderStatus"
                  sizes="xs"
                  value={selectedOrder.orderStatus}
                  options={COLUMNS.map((c) => ({
                    label: c.label,
                    value: c.status,
                  }))}
                  onChange={(e) =>
                    handleUpdateOrderStatus(
                      selectedOrder,
                      e.target.value as OrderStatus,
                    )
                  }
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-gray-700">Items</p>
              {isItemsLoading && (
                <p className="text-xs text-gray-400">Loading items...</p>
              )}
              {!isItemsLoading &&
                itemResponse.data.map((item) => (
                  <div
                    key={item.orderItemId}
                    className="flex items-center justify-between gap-3 rounded-md border border-gray-200 p-2"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">
                        {item.prodVarName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.quantity} x {formatPeso(item.unitPrice)} ={" "}
                        {formatPeso(item.lineTotal)}
                      </p>
                    </div>
                    <div className="w-40">
                      <DropdownSelect
                        name="itemStatus"
                        sizes="xs"
                        value={item.itemStatus}
                        options={itemStatusOptions}
                        onChange={(e) =>
                          handleUpdateItemStatus(
                            item.orderItemId,
                            e.target.value as OrderItemStatus,
                          )
                        }
                      />
                    </div>
                  </div>
                ))}
            </div>

            <div className="flex justify-end border-t pt-3">
              <Button
                label="Close"
                size="sm"
                color="secondary"
                onClick={() => setSelectedOrder(null)}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OrderKanbanView;
