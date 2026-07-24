"use client";

import Button from "@/components/shared/Button";
import ConfirmationModal from "@/components/shared/ConfirmationModal";
import DropdownSelect from "@/components/shared/DropdownSelect";
import Input from "@/components/shared/Input";
import LoaderComponent from "@/components/shared/LoaderComponent";
import Modal from "@/components/shared/Modal";
import PageHeader from "@/components/shared/PageHeader";
import PageLayout from "@/components/shared/PageLayout";
import Table, { Column } from "@/components/shared/Table";
import Textarea from "@/components/shared/TextArea";
import { OrderReceiptPDF } from "@/components/pdf/OrderReceiptPDF";
import { useSession } from "@/hooks/useSession";
import { ApiResponse } from "@/types/api";
import { DisplayOrderDto, DisplayOrderItemDto } from "@/dtos/orders.dto";
import { DisplayProductsDtos } from "@/dtos/products.dto";
import { OrderItemStatus, Orders } from "@/types/orders";
import { fetcher } from "@/utils/fetcher";
import { formatDateToWords } from "@/utils/formatDateToWords";
import { formatPeso } from "@/utils/formatPeso";
import { PDFViewer } from "@react-pdf/renderer";
import { ArrowLeft, CheckCircle2, Printer, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
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
      toast.success("Internal notes updated!");
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
      setShowReceipt(true);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsCompletingOrder(false);
      setShowComplete(false);
    }
  };

  const itemColumns: Column<DisplayOrderItemDto>[] = [
    { key: "#", name: "#", selector: (_row, index) => index + 1 },
    { key: "prodVarName", name: "Item" },
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

  return (
    <PageLayout className="p-2 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <PageHeader
          title={order.orderNumber}
          subtitle={`Placed ${formatDateToWords(order.orderCreatedAt)}`}
        />
        <div className="flex gap-2">
          {order.orderStatus !== "COMPLETED" &&
            order.orderStatus !== "CANCELLED" && (
              <Button
                color="primary"
                size="sm"
                icon={CheckCircle2}
                label="Complete Order"
                onClick={() => setShowComplete(true)}
              />
            )}
          {order.orderStatus === "COMPLETED" && (
            <Button
              color="secondary"
              size="sm"
              icon={Printer}
              label="Print / Download Receipt"
              onClick={() => setShowReceipt(true)}
            />
          )}
          {canDelete && (
            <Button
              color="danger"
              size="sm"
              icon={Trash2}
              onClick={() => setShowDelete(true)}
            />
          )}
          <Button
            color="secondary"
            size="sm"
            icon={ArrowLeft}
            label="Back"
            onClick={() => router.back()}
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-4">
        <div className="flex-1 min-h-0 flex flex-col gap-3 bg-white">
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

        <div className="w-full md:w-80 flex-shrink-0 flex flex-col gap-3">
          <div className="rounded-md border border-gray-200 p-3">
            <span className="text-xs text-gray-500">Customer</span>
            <p className="mt-1 text-sm font-semibold">
              {order.customerName || "Walk-in Customer"}
            </p>
            {order.customerPhone && (
              <p className="mt-1 text-xs text-gray-600">
                📞 {order.customerPhone}
              </p>
            )}
            {order.customerEmail && (
              <p className="mt-1 text-xs text-gray-600">
                ✉️ {order.customerEmail}
              </p>
            )}
          </div>

          <div className="rounded-md border border-gray-200 p-3">
            <span className="text-xs text-gray-500">Order Status</span>
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

          <div className="rounded-md border border-gray-200 p-3">
            <span className="text-xs text-gray-500">Payment Status</span>
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

          <div className="rounded-md border border-gray-200 p-3">
            <span className="text-xs text-gray-500">Fulfillment</span>
            <p className="mt-1 text-sm font-semibold">
              {order.fulfillmentType}
            </p>
          </div>

          <div className="rounded-md border border-gray-200 p-3 flex flex-col gap-2">
            <span className="text-xs text-gray-500">Delivery Address</span>
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

          {order.customerNotes && (
            <div className="rounded-md border border-gray-200 p-3">
              <span className="text-xs text-gray-500">Customer Notes</span>
              <p className="mt-1 text-sm">{order.customerNotes}</p>
            </div>
          )}

          <div className="rounded-md border border-gray-200 p-3 flex flex-col gap-2">
            <span className="text-xs text-gray-500">
              Internal Notes (staff only)
            </span>
            <Textarea
              label=""
              sizes="xs"
              value={internalNotesInput}
              onChange={(e) => setInternalNotesInput(e.target.value)}
              disabled={isSavingNotes}
            />
            <div className="flex justify-end">
              <Button
                label="Save"
                size="xs"
                color="secondary"
                hasBorder
                loading={isSavingNotes}
                disabled={internalNotesInput === (order.internalNotes ?? "")}
                onClick={handleSaveInternalNotes}
              />
            </div>
          </div>

          <div className="rounded-md border border-gray-200 p-3 flex flex-col gap-2 text-sm text-gray-700">
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
