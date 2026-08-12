"use client";

import Button from "@/components/shared/Button";
import ConfirmationModal from "@/components/shared/ConfirmationModal";
import DropdownSelect from "@/components/shared/DropdownSelect";
import Input from "@/components/shared/Input";
import LoaderComponent from "@/components/shared/LoaderComponent";
import Modal from "@/components/shared/Modal";
import PageLayout from "@/components/shared/PageLayout";
import Table, { Column } from "@/components/shared/Table";
import Textarea from "@/components/shared/TextArea";
import { OrderReceiptPDF } from "@/components/pdf/OrderReceiptPDF";
import { useSession } from "@/hooks/useSession";
import { ApiResponse } from "@/types/api";
import {
  DisplayOrderDto,
  DisplayOrderItemDto,
  DisplayOrderStatusHistoryDto,
} from "@/dtos/orders.dto";
import { DisplayProductsDtos } from "@/dtos/products.dto";
import { OrderItemStatus, OrderStatus, Orders } from "@/types/orders";
import { fetcher } from "@/utils/fetcher";
import { formatDateToWords } from "@/utils/formatDateToWords";
import { formatPeso } from "@/utils/formatPeso";
import { getNextCloudImageUrl } from "@/utils/getNextCloudImageUrl";
import { PDFViewer } from "@react-pdf/renderer";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  ImageIcon,
  Mail,
  MapPin,
  Phone,
  Printer,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import useSWR from "swr";

const itemStatusOptions: { label: string; value: OrderItemStatus }[] = [
  { label: "Pending", value: "PENDING" },
  { label: "Fulfilled", value: "FULFILLED" },
  { label: "Out of Stock", value: "OUT_OF_STOCK" },
  { label: "Substituted", value: "SUBSTITUTED" },
];

// staff preparing orders can only update status - not delete items/orders
const RESTRICTED_POSITIONS = ["staff", "supervisor", "purchaser"];

const PICKUP_STEPS: { status: OrderStatus; label: string }[] = [
  { status: "CONFIRMED", label: "Order confirmed" },
  { status: "PREPARING", label: "Preparing" },
  { status: "READY_FOR_PICKUP", label: "Ready for pickup" },
  { status: "COMPLETED", label: "Picked up" },
];

const DELIVERY_STEPS: { status: OrderStatus; label: string }[] = [
  { status: "CONFIRMED", label: "Order confirmed" },
  { status: "PREPARING", label: "Preparing" },
  { status: "OUT_FOR_DELIVERY", label: "Out for delivery" },
  { status: "COMPLETED", label: "Delivered" },
];

const paymentStatusBadge: Record<string, string> = {
  UNPAID: "bg-red-100 text-red-700",
  PARTIALLY_PAID: "bg-yellow-100 text-yellow-700",
  PAID: "bg-green-100 text-green-700",
  REFUNDED: "bg-gray-200 text-gray-700",
};

const fulfillmentBadge: Record<string, string> = {
  PICKUP: "bg-blue-100 text-blue-700",
  DELIVERY: "bg-purple-100 text-purple-700",
};

const Badge = ({ label, className }: { label: string; className: string }) => (
  <span
    className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ${className}`}
  >
    {label.replaceAll("_", " ")}
  </span>
);

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("") || "?";

const Page = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useSession();
  const { orderId } = params;
  const storeId = user?.storeId;
  const canDelete = !(
    user?.userRole === "employee" &&
    RESTRICTED_POSITIONS.includes(user?.empPosition ?? "")
  );
  const [showDelete, setShowDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [isCompletingOrder, setIsCompletingOrder] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deliveryAddressInput, setDeliveryAddressInput] = useState("");
  const [internalNotesInput, setInternalNotesInput] = useState("");
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [addProdVarId, setAddProdVarId] = useState("");
  const [addQuantity, setAddQuantity] = useState("1");
  const [addUnitPrice, setAddUnitPrice] = useState("");
  const [isAddingItem, setIsAddingItem] = useState(false);

  const {
    data: response,
    mutate,
    isLoading,
  } = useSWR<ApiResponse<DisplayOrderDto[]>>(
    storeId && orderId ? `/api/order/${storeId}/${orderId}` : null,
    fetcher,
  );

  const {
    data: itemResponse = { data: [] },
    mutate: mutateItems,
    isLoading: isItemsLoading,
  } = useSWR<{ data: DisplayOrderItemDto[] }>(
    storeId && orderId ? `/api/order/${storeId}/${orderId}/items` : null,
    fetcher,
  );

  const { data: productResponse = { data: [] } } = useSWR<
    ApiResponse<DisplayProductsDtos[]>
  >(
    storeId && canDelete ? `/api/products/${storeId}?limit=200` : null,
    fetcher,
  );

  const {
    data: historyResponse = { data: [] },
    mutate: mutateHistory,
  } = useSWR<{
    data: DisplayOrderStatusHistoryDto[];
  }>(
    storeId && orderId ? `/api/order/${storeId}/${orderId}/history` : null,
    fetcher,
  );

  const variantOptions = useMemo(() => {
    return (productResponse.data ?? []).flatMap(
      (product) =>
        product.productVariants?.map((variant) => ({
          label: `${product.prodName} - ${variant.prodVarName} (${formatPeso(
            variant.prodVarPrice,
          )})`,
          value: variant.prodVarId,
          prodVarPrice: variant.prodVarPrice,
        })) ?? [],
    );
  }, [productResponse]);

  const order = response?.data?.[0];

  const recalcTotals = async (items: DisplayOrderItemDto[]) => {
    if (!storeId || !orderId || !order) return;

    const subtotal = items.reduce(
      (sum, i) => sum + Number(i.quantity) * Number(i.unitPrice),
      0,
    );
    const totalAmount = subtotal - order.discountAmount + order.deliveryFee;

    await fetch(`/api/order/${storeId}/${orderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subtotal, totalAmount }),
    });
    mutate();
  };

  useEffect(() => {
    if (!order) return;
    setDeliveryAddressInput(order.deliveryAddress ?? "");
    setInternalNotesInput(order.internalNotes ?? "");
  }, [order?.orderId, order?.deliveryAddress, order?.internalNotes]);

  const handleUpdateOrderField = async (data: Partial<Orders>) => {
    if (!storeId || !orderId) return;

    setIsUpdating(true);
    try {
      const result = await fetch(`/api/order/${storeId}/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const res = await result.json();
      if (!res.success) {
        throw new Error(res.message);
      }
      toast.success("Order updated!");
      mutate();
      if (data.orderStatus) mutateHistory();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveDeliveryAddress = async () => {
    if (!storeId || !orderId) return;

    setIsSavingAddress(true);
    try {
      const result = await fetch(`/api/order/${storeId}/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryAddress: deliveryAddressInput }),
      });
      const res = await result.json();
      if (!res.success) {
        throw new Error(res.message);
      }
      toast.success("Delivery address updated!");
      mutate();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleSaveInternalNotes = async () => {
    if (!storeId || !orderId) return;

    setIsSavingNotes(true);
    try {
      const result = await fetch(`/api/order/${storeId}/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ internalNotes: internalNotesInput }),
      });
      const res = await result.json();
      if (!res.success) {
        throw new Error(res.message);
      }
      toast.success("Preparation notes updated!");
      mutate();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleUpdateItemStatus = async (
    orderItemId: number,
    itemStatus: OrderItemStatus,
  ) => {
    if (!storeId || !orderId) return;

    try {
      const result = await fetch(
        `/api/order/${storeId}/${orderId}/items/${orderItemId}`,
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

  const handleRemoveItem = async (orderItemId: number) => {
    if (!storeId || !orderId) return;

    try {
      const result = await fetch(
        `/api/order/${storeId}/${orderId}/items/${orderItemId}`,
        { method: "DELETE" },
      );
      const res = await result.json();
      if (!res.success) {
        throw new Error(res.message);
      }
      toast.success("Item removed!");
      const fresh = await mutateItems();
      await recalcTotals(fresh?.data ?? []);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleUpdateItemFields = async (
    orderItemId: number,
    patch: Partial<Pick<DisplayOrderItemDto, "quantity" | "unitPrice">>,
  ) => {
    if (!storeId || !orderId) return;

    try {
      const result = await fetch(
        `/api/order/${storeId}/${orderId}/items/${orderItemId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        },
      );
      const res = await result.json();
      if (!res.success) {
        throw new Error(res.message);
      }
      toast.success("Item updated!");
      const fresh = await mutateItems();
      await recalcTotals(fresh?.data ?? []);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleItemsDataChange = async (newData: DisplayOrderItemDto[]) => {
    if (!storeId || !orderId) return;

    const changedRows = newData.filter((row) => {
      const original = itemResponse.data.find(
        (r) => r.orderItemId === row.orderItemId,
      );
      return (
        original &&
        (Number(original.quantity) !== Number(row.quantity) ||
          Number(original.unitPrice) !== Number(row.unitPrice))
      );
    });

    if (changedRows.length === 0) return;

    try {
      await Promise.all(
        changedRows.map((row) =>
          fetch(`/api/order/${storeId}/${orderId}/items/${row.orderItemId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              quantity: Number(row.quantity),
              unitPrice: Number(row.unitPrice),
            }),
          }),
        ),
      );
      toast.success("Item(s) updated!");
      const fresh = await mutateItems();
      await recalcTotals(fresh?.data ?? []);
    } catch (e) {
      toast.error("Failed to update item(s)");
    }
  };

  const handleSelectAddVariant = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setAddProdVarId(value);

    const variant = variantOptions.find((v) => String(v.value) === value);
    if (variant) {
      setAddUnitPrice(String(variant.prodVarPrice));
    }
  };

  const handleAddItem = async () => {
    if (!storeId || !orderId) return;

    if (!addProdVarId) {
      toast.error("Select an item first!");
      return;
    }

    const qty = Number(addQuantity) || 0;
    const price = Number(addUnitPrice) || 0;

    if (qty <= 0) {
      toast.error("Quantity must be greater than 0!");
      return;
    }

    setIsAddingItem(true);
    try {
      const result = await fetch(`/api/order/${storeId}/${orderId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([
          {
            prodVarId: Number(addProdVarId),
            quantity: qty,
            unitPrice: price,
          },
        ]),
      });
      const res = await result.json();
      if (!res.success) {
        throw new Error(res.message);
      }
      toast.success("Item added!");
      const fresh = await mutateItems();
      await recalcTotals(fresh?.data ?? []);
      setAddProdVarId("");
      setAddQuantity("1");
      setAddUnitPrice("");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsAddingItem(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!storeId || !orderId) return;

    setIsDeleting(true);
    try {
      const result = await fetch(`/api/order/${storeId}/${orderId}`, {
        method: "DELETE",
      });
      const res = await result.json();
      if (!res.success) {
        throw new Error(res.message);
      }
      toast.success("Order deleted!");
      router.push("/orders");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsDeleting(false);
      setShowDelete(false);
    }
  };

  const handleCompleteOrder = async () => {
    if (!storeId || !orderId) return;

    setIsCompletingOrder(true);
    try {
      const result = await fetch(`/api/order/${storeId}/${orderId}/complete`, {
        method: "POST",
      });
      const res = await result.json();
      if (!res.success) {
        throw new Error(res.message);
      }
      toast.success("Order completed! A sale has been created.");
      mutate();
      mutateHistory();
      setShowReceipt(true);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsCompletingOrder(false);
      setShowComplete(false);
    }
  };

  const itemColumns: Column<DisplayOrderItemDto>[] = [
    {
      key: "prodVarName",
      name: "Item",
      selector: (row) => {
        const imageUrl = getNextCloudImageUrl(row.prodVarImage);

        return (
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={row.prodVarName}
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-300">
                  <ImageIcon className="h-4 w-4" />
                </div>
              )}
            </div>
            <span className="font-medium text-gray-800">{row.prodVarName}</span>
          </div>
        );
      },
    },
    {
      key: "quantity",
      name: "Qty",
      editable: canDelete,
      inputType: "number",
    },
    {
      key: "unitPrice",
      name: "Unit Price",
      editable: canDelete,
      inputType: "number",
      selector: (row) => formatPeso(row.unitPrice),
    },
    {
      key: "lineTotal",
      name: "Line Total",
      selector: (row) => formatPeso(row.lineTotal),
    },
    {
      key: "itemStatus",
      name: "Status",
      selector: (row) => (
        <DropdownSelect
          name="itemStatus"
          sizes="xs"
          value={row.itemStatus}
          options={itemStatusOptions}
          onChange={(e) =>
            handleUpdateItemStatus(
              row.orderItemId,
              e.target.value as OrderItemStatus,
            )
          }
        />
      ),
    },
  ];

  if (isLoading) return <LoaderComponent />;
  if (!order)
    return (
      <PageLayout>
        <></>
      </PageLayout>
    );

  const steps =
    order.fulfillmentType === "DELIVERY" ? DELIVERY_STEPS : PICKUP_STEPS;
  const currentStepIndex = steps.findIndex(
    (s) => s.status === order.orderStatus,
  );
  const isCancelled = order.orderStatus === "CANCELLED";
  const nextStep =
    !isCancelled && currentStepIndex < steps.length - 1
      ? steps[currentStepIndex + 1]
      : null;

  const packedCount = itemResponse.data.filter(
    (i) => i.itemStatus === "FULFILLED",
  ).length;

  const activity = (historyResponse.data ?? []).map((entry) => ({
    label:
      entry.note ||
      `Status updated to ${entry.orderStatus.replaceAll("_", " ").toLowerCase()}`,
    at: entry.historyCreatedAt,
    actor: entry.changedByName?.trim() || "System",
  }));

  return (
    <PageLayout className="p-2 flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Link href="/orders" className="hover:text-gray-700">
            Orders
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span>{order.orderNumber}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-gray-900">
                Order #{order.orderNumber}
              </h1>
              <Badge
                label={order.paymentStatus}
                className={paymentStatusBadge[order.paymentStatus] ?? ""}
              />
              <Badge
                label={order.fulfillmentType}
                className={fulfillmentBadge[order.fulfillmentType] ?? ""}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Placed{" "}
              {formatDateToWords(order.orderCreatedAt, {
                showHour: true,
                showMinute: true,
              })}
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <div>
              {" "}
              <Button
                color="secondary"
                size="sm"
                icon={Printer}
                label="Print Receipt"
                onClick={() => setShowReceipt(true)}
              />
            </div>
            {nextStep && nextStep.status !== "COMPLETED" && (
              <div>
                <Button
                  color="primary"
                  size="sm"
                  icon={CheckCircle2}
                  label={`Mark as ${nextStep.label}`}
                  loading={isUpdating}
                  onClick={() =>
                    handleUpdateOrderField({ orderStatus: nextStep.status })
                  }
                />
              </div>
            )}
            {nextStep && nextStep.status === "COMPLETED" && (
              <div>
                <Button
                  color="primary"
                  size="sm"
                  icon={CheckCircle2}
                  label="Complete Order"
                  onClick={() => setShowComplete(true)}
                />
              </div>
            )}
            {canDelete && (
              <div>
                {" "}
                <Button
                  color="danger"
                  size="sm"
                  icon={Trash2}
                  onClick={() => setShowDelete(true)}
                />
              </div>
            )}
            <div>
              <Button
                color="secondary"
                size="sm"
                icon={ArrowLeft}
                label="Back"
                onClick={() => router.back()}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Step progress */}
      {isCancelled ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-600">
          This order was cancelled.
        </div>
      ) : (
        <div className="rounded-md border border-gray-200 bg-white p-4">
          <div className="flex items-center overflow-x-auto no-scrollbar -mx-1 px-1">
            {steps.map((step, i) => {
              const isDone = currentStepIndex >= 0 && i < currentStepIndex;
              const isCurrent = i === currentStepIndex;
              const isUpcomingNext = currentStepIndex === -1 && i === 0;
              return (
                <React.Fragment key={step.status}>
                  <div className="flex flex-col items-center gap-1 min-w-[110px]">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                        isDone
                          ? "bg-emerald-500 text-white"
                          : isCurrent || isUpcomingNext
                            ? "bg-primary-1 text-white"
                            : "bg-gray-100 text-gray-400 border border-gray-200"
                      }`}
                    >
                      {isDone ? <Check className="h-4 w-4" /> : i + 1}
                    </div>
                    <span
                      className={`text-[11px] text-center font-medium ${
                        isDone || isCurrent ? "text-gray-800" : "text-gray-400"
                      }`}
                    >
                      {step.label}
                    </span>
                    {i === 0 && (
                      <span className="text-[10px] text-gray-400">
                        {formatDateToWords(order.orderCreatedAt, {
                          showHourAndMinuteOnly: true,
                        })}
                      </span>
                    )}
                    {isCurrent && i !== 0 && (
                      <span className="text-[10px] text-gray-400">
                        {formatDateToWords(order.orderUpdatedAt, {
                          showHourAndMinuteOnly: true,
                        })}
                      </span>
                    )}
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 ${
                        i < currentStepIndex ? "bg-emerald-500" : "bg-gray-200"
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          <div className="mt-3 flex justify-end">
            <DropdownSelect
              name="orderStatus"
              sizes="xs"
              value={order.orderStatus}
              disabled={isUpdating}
              options={[
                { label: "Pending", value: "PENDING" },
                { label: "Confirmed", value: "CONFIRMED" },
                { label: "Preparing", value: "PREPARING" },
                { label: "Ready for Pickup", value: "READY_FOR_PICKUP" },
                { label: "Out for Delivery", value: "OUT_FOR_DELIVERY" },
                { label: "Completed", value: "COMPLETED" },
                { label: "Cancelled", value: "CANCELLED" },
              ]}
              onChange={(e) =>
                handleUpdateOrderField({
                  orderStatus: e.target.value as Orders["orderStatus"],
                })
              }
            />
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-4">
        <div className="flex-1 min-h-0 flex flex-col gap-3">
          <div className="rounded-md border border-gray-200 bg-white p-3 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-800">
                Prepare items
              </p>
              <span className="text-xs text-gray-500">
                {packedCount} of {itemResponse.data.length} item
                {itemResponse.data.length !== 1 ? "s" : ""} packed
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-gray-100">
              <div
                className="h-1.5 rounded-full bg-primary-1"
                style={{
                  width: `${
                    itemResponse.data.length
                      ? (packedCount / itemResponse.data.length) * 100
                      : 0
                  }%`,
                }}
              />
            </div>

            <div className="hidden md:block">
              <Table
                isRounded={false}
                columns={itemColumns}
                data={itemResponse.data}
                loading={isItemsLoading}
                maxHeight="h-full"
                showActions={canDelete}
                updateData={canDelete ? handleItemsDataChange : undefined}
                uniqueIdKey="orderItemId"
                renderActions={(row) => (
                  <button
                    type="button"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => handleRemoveItem(row.orderItemId)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              />
            </div>

            {/* Mobile card view - the generic Table only scrolls horizontally, which doesn't work well for a 5-column list on a phone */}
            <div className="flex flex-col gap-3 md:hidden">
              {isItemsLoading && (
                <p className="text-xs text-gray-400 text-center py-6">
                  Loading items...
                </p>
              )}
              {!isItemsLoading && itemResponse.data.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-6">
                  No items in this order.
                </p>
              )}
              {itemResponse.data.map((item) => {
                const imageUrl = getNextCloudImageUrl(item.prodVarImage);

                return (
                  <div
                    key={item.orderItemId}
                    className="rounded-md border border-gray-200 p-3 flex flex-col gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={item.prodVarName}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gray-300">
                            <ImageIcon className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-800">
                          {item.prodVarName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatPeso(item.unitPrice)} each
                        </p>
                      </div>
                      {canDelete && (
                        <button
                          type="button"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleRemoveItem(item.orderItemId)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        key={`qty-${item.orderItemId}-${item.quantity}`}
                        label="Qty"
                        sizes="xs"
                        type="number"
                        defaultValue={item.quantity}
                        disabled={!canDelete}
                        onBlur={(e) => {
                          const value = Number(e.target.value) || 0;
                          if (value > 0 && value !== Number(item.quantity)) {
                            handleUpdateItemFields(item.orderItemId, {
                              quantity: value,
                            });
                          }
                        }}
                      />
                      <Input
                        key={`price-${item.orderItemId}-${item.unitPrice}`}
                        label="Unit Price"
                        sizes="xs"
                        type="number"
                        defaultValue={item.unitPrice}
                        disabled={!canDelete}
                        onBlur={(e) => {
                          const value = Number(e.target.value) || 0;
                          if (value !== Number(item.unitPrice)) {
                            handleUpdateItemFields(item.orderItemId, {
                              unitPrice: value,
                            });
                          }
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-100 pt-2">
                      <span className="text-xs text-gray-500">
                        Line Total
                      </span>
                      <span className="text-sm font-semibold text-gray-800">
                        {formatPeso(item.lineTotal)}
                      </span>
                    </div>

                    <DropdownSelect
                      name={`itemStatus-${item.orderItemId}`}
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
                );
              })}
            </div>

            {canDelete && (
              <div className="rounded-md border border-gray-200 p-3 flex flex-col gap-3">
                <p className="text-xs font-semibold text-gray-700">Add Item</p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                  <div className="md:col-span-2">
                    <DropdownSelect
                      name="addProdVarId"
                      label="Item"
                      sizes="xs"
                      placeholder="Select item"
                      value={addProdVarId}
                      options={variantOptions.map((v) => ({
                        label: v.label,
                        value: v.value,
                      }))}
                      onChange={handleSelectAddVariant}
                      disabled={isAddingItem}
                    />
                  </div>
                  <Input
                    label="Quantity"
                    sizes="xs"
                    type="number"
                    value={addQuantity}
                    onChange={(e) => setAddQuantity(e.target.value)}
                    disabled={isAddingItem}
                  />
                  <Input
                    label="Unit Price"
                    sizes="xs"
                    type="number"
                    value={addUnitPrice}
                    onChange={(e) => setAddUnitPrice(e.target.value)}
                    disabled={isAddingItem}
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    label="Add Item"
                    size="xs"
                    color="secondary"
                    hasBorder
                    loading={isAddingItem}
                    onClick={handleAddItem}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="rounded-md border border-gray-200 bg-white p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-800">
                Preparation Notes
              </p>
            </div>
            <Textarea
              label=""
              sizes="xs"
              placeholder="Add a note for store staff preparing this order..."
              value={internalNotesInput}
              onChange={(e) => setInternalNotesInput(e.target.value)}
              disabled={isSavingNotes}
            />
            <div className="flex justify-end">
              <Button
                label="Save Note"
                size="xs"
                color="secondary"
                hasBorder
                loading={isSavingNotes}
                disabled={internalNotesInput === (order.internalNotes ?? "")}
                onClick={handleSaveInternalNotes}
              />
            </div>
          </div>

          <div className="rounded-md border border-gray-200 bg-white p-3 flex flex-col gap-3">
            <p className="text-sm font-semibold text-gray-800">
              Order Activity
            </p>
            <div className="flex flex-col gap-3">
              {activity.length === 0 && (
                <p className="text-xs text-gray-400">
                  No activity recorded for this order yet.
                </p>
              )}
              {activity.map((entry, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    {i < activity.length - 1 && (
                      <div className="w-px flex-1 bg-gray-200" />
                    )}
                  </div>
                  <div className="pb-3">
                    <p className="text-xs font-semibold text-gray-800">
                      {entry.label}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {formatDateToWords(entry.at, {
                        showHour: true,
                        showMinute: true,
                      })}{" "}
                      · {entry.actor}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full md:w-80 flex-shrink-0 flex flex-col gap-3">
          <div className="rounded-md border border-gray-200 bg-white p-3 flex flex-col gap-3">
            <p className="text-sm font-semibold text-gray-800">
              Customer &{" "}
              {order.fulfillmentType === "DELIVERY" ? "Delivery" : "Pickup"}
            </p>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-1 to-primary-1/60 text-sm font-bold text-white">
                {getInitials(order.customerName || "Walk-in Customer")}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {order.customerName || "Walk-in Customer"}
                </p>
              </div>
            </div>

            {order.customerEmail && (
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Mail className="h-3.5 w-3.5 text-gray-400" />
                {order.customerEmail}
              </div>
            )}
            {order.customerPhone && (
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Phone className="h-3.5 w-3.5 text-gray-400" />
                {order.customerPhone}
              </div>
            )}

            <div className="border-t border-gray-100 pt-3">
              <div className="flex items-center gap-2 text-xs text-gray-700 font-medium">
                <MapPin className="h-3.5 w-3.5 text-gray-400" />
                {order.storeName ?? "Store"} ·{" "}
                {order.fulfillmentType === "DELIVERY"
                  ? "Delivery"
                  : "Store pickup"}
              </div>

              {order.fulfillmentType === "DELIVERY" && (
                <div className="mt-2 flex flex-col gap-2">
                  <Input
                    label=""
                    sizes="xs"
                    value={deliveryAddressInput}
                    onChange={(e) => setDeliveryAddressInput(e.target.value)}
                    disabled={isSavingAddress}
                  />
                  <div className="flex justify-end">
                    <Button
                      label="Save"
                      size="xs"
                      color="secondary"
                      hasBorder
                      loading={isSavingAddress}
                      disabled={
                        deliveryAddressInput === (order.deliveryAddress ?? "")
                      }
                      onClick={handleSaveDeliveryAddress}
                    />
                  </div>
                </div>
              )}
            </div>

            {order.customerNotes && (
              <div className="border-t border-gray-100 pt-3">
                <span className="text-[11px] text-gray-500">
                  Customer Notes
                </span>
                <p className="mt-1 text-xs text-gray-700">
                  {order.customerNotes}
                </p>
              </div>
            )}
          </div>

          <div className="rounded-md border border-gray-200 bg-white p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-800">
                Payment Summary
              </p>
              <Badge
                label={order.paymentStatus}
                className={paymentStatusBadge[order.paymentStatus] ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2 text-sm text-gray-700">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPeso(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount</span>
                <span>{formatPeso(order.discountAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span>{formatPeso(order.deliveryFee)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>Total</span>
                <span>{formatPeso(order.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 pt-1">
                <span>Payment Method</span>
                <span>{order.payMetName ?? "-"}</span>
              </div>
            </div>

            <DropdownSelect
              name="paymentStatus"
              sizes="xs"
              value={order.paymentStatus}
              disabled={isUpdating}
              options={[
                { label: "Unpaid", value: "UNPAID" },
                { label: "Partially Paid", value: "PARTIALLY_PAID" },
                { label: "Paid", value: "PAID" },
                { label: "Refunded", value: "REFUNDED" },
              ]}
              onChange={(e) =>
                handleUpdateOrderField({
                  paymentStatus: e.target.value as Orders["paymentStatus"],
                })
              }
            />
          </div>
        </div>
      </div>

      <ConfirmationModal
        onConfirm={handleDeleteOrder}
        confirmationInfo={`Are you sure you want to delete order ${order.orderNumber}?`}
        onClose={() => setShowDelete(false)}
        isShow={showDelete}
        isLoading={isDeleting}
      />

      <ConfirmationModal
        onConfirm={handleCompleteOrder}
        confirmationInfo={`Complete order ${order.orderNumber}? This will create a sale for ${formatPeso(order.totalAmount)} and cannot be undone.`}
        onClose={() => setShowComplete(false)}
        isShow={showComplete}
        isLoading={isCompletingOrder}
      />

      <Modal
        className="h-[95%]"
        isOpen={showReceipt}
        size="xl"
        title="Order Receipt"
        onClose={() => setShowReceipt(false)}
      >
        <PDFViewer width="100%" height="100%">
          <OrderReceiptPDF order={order} items={itemResponse.data} />
        </PDFViewer>
      </Modal>
    </PageLayout>
  );
};

export default Page;
