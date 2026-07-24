"use client";

import Button from "@/components/shared/Button";
import DropdownSelect from "@/components/shared/DropdownSelect";
import Input from "@/components/shared/Input";
import Table, { Column } from "@/components/shared/Table";
import Textarea from "@/components/shared/TextArea";
import { CreateOrderDto, CreateOrderItemDto } from "@/dtos/orders.dto";
import { DisplayProductsDtos } from "@/dtos/products.dto";
import { UserAuth } from "@/hooks/useSession";
import { PaymentMethods } from "@/types/payment-methods";
import { ApiResponse } from "@/types/api";
import { fetcher } from "@/utils/fetcher";
import { formatPeso } from "@/utils/formatPeso";
import { Trash2 } from "lucide-react";
import React, { useMemo, useState } from "react";
import toast from "react-hot-toast";
import useSWR from "swr";

interface CreateOrderModalProps {
  storeId: number | null;
  user: UserAuth | null;
  onCancel: () => void;
  onSubmit: (data: Omit<CreateOrderDto, "storeId">) => Promise<boolean>;
}

interface OrderItemRow extends CreateOrderItemDto {
  prodVarName: string;
}

const orderItemColumns: Column<OrderItemRow>[] = [
  { key: "#", name: "#", selector: (_row, index) => index + 1 },
  { key: "prodVarName", name: "Item" },
  { key: "quantity", name: "Qty" },
  {
    key: "unitPrice",
    name: "Unit Price",
    selector: (row) => formatPeso(row.unitPrice),
  },
  {
    key: "lineTotal",
    name: "Line Total",
    selector: (row) => formatPeso(row.unitPrice * row.quantity),
  },
];

const CreateOrderModal = ({
  storeId,
  onCancel,
  onSubmit,
}: CreateOrderModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerId, setCustomerId] = useState<string>("");
  const [fulfillmentType, setFulfillmentType] = useState<"PICKUP" | "DELIVERY">(
    "PICKUP",
  );
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [payMetId, setPayMetId] = useState<string>("");
  const [paymentReference, setPaymentReference] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");

  const [selectedProdVarId, setSelectedProdVarId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("1");
  const [unitPrice, setUnitPrice] = useState<string>("");
  const [items, setItems] = useState<OrderItemRow[]>([]);

  const { data: paymentMethodResponse = { data: [] } } = useSWR<{
    data: PaymentMethods[];
  }>(storeId ? `/api/payment-method/store/${storeId}` : null, fetcher);

  const { data: productResponse = { data: [] } } = useSWR<
    ApiResponse<DisplayProductsDtos[]>
  >(storeId ? `/api/products/${storeId}?limit=200` : null, fetcher);

  const variantOptions = useMemo(() => {
    return (productResponse.data ?? []).flatMap(
      (product) =>
        product.productVariants?.map((variant) => ({
          label: `${product.prodName} - ${variant.prodVarName} (${formatPeso(
            variant.prodVarPrice,
          )})`,
          value: variant.prodVarId,
          prodVarName: `${product.prodName} - ${variant.prodVarName}`,
          prodVarPrice: variant.prodVarPrice,
        })) ?? [],
    );
  }, [productResponse]);

  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );

  const handleSelectVariant = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedProdVarId(value);

    const variant = variantOptions.find((v) => String(v.value) === value);
    if (variant) {
      setUnitPrice(String(variant.prodVarPrice));
    }
  };

  const handleAddItem = () => {
    if (!selectedProdVarId) {
      toast.error("Select an item first!");
      return;
    }
    const variant = variantOptions.find(
      (v) => String(v.value) === selectedProdVarId,
    );
    if (!variant) return;

    const qty = Number(quantity) || 0;
    const price = Number(unitPrice) || 0;

    if (qty <= 0) {
      toast.error("Quantity must be greater than 0!");
      return;
    }

    setItems((prev) => [
      ...prev,
      {
        prodVarId: Number(selectedProdVarId),
        prodVarName: variant.prodVarName,
        quantity: qty,
        unitPrice: price,
      },
    ]);

    setSelectedProdVarId("");
    setQuantity("1");
    setUnitPrice("");
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!payMetId) {
      toast.error("Select a payment method!");
      return;
    }
    if (fulfillmentType === "DELIVERY" && !deliveryAddress.trim()) {
      toast.error("Delivery address is required for delivery orders!");
      return;
    }
    if (items.length === 0) {
      toast.error("Add at least one item!");
      return;
    }

    setIsSubmitting(true);
    try {
      const data: Omit<CreateOrderDto, "storeId"> = {
        customerId: customerId ? Number(customerId) : null,
        fulfillmentType,
        deliveryAddress: fulfillmentType === "DELIVERY" ? deliveryAddress : null,
        payMetId: Number(payMetId),
        paymentReference: paymentReference || null,
        customerNotes: customerNotes || null,
        subtotal,
        discountAmount: 0,
        deliveryFee: 0,
        totalAmount: subtotal,
        items: items.map(({ prodVarId, quantity, unitPrice }) => ({
          prodVarId,
          quantity,
          unitPrice,
        })),
      };

      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Customer ID (optional)"
          sizes="xs"
          type="number"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          disabled={isSubmitting}
        />

        <DropdownSelect
          name="fulfillmentType"
          label="Fulfillment Type"
          sizes="xs"
          value={fulfillmentType}
          options={[
            { label: "Pickup", value: "PICKUP" },
            { label: "Delivery", value: "DELIVERY" },
          ]}
          onChange={(e) =>
            setFulfillmentType(e.target.value as "PICKUP" | "DELIVERY")
          }
          disabled={isSubmitting}
        />

        {fulfillmentType === "DELIVERY" && (
          <Input
            label="Delivery Address"
            sizes="xs"
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            disabled={isSubmitting}
          />
        )}

        <DropdownSelect
          name="payMetId"
          label="Payment Method"
          sizes="xs"
          placeholder="Select payment method"
          value={payMetId}
          options={paymentMethodResponse.data.map((pm) => ({
            label: pm.payMetName,
            value: pm.payMetId,
          }))}
          onChange={(e) => setPayMetId(e.target.value)}
          disabled={isSubmitting}
        />

        <Input
          label="Payment Reference (optional)"
          sizes="xs"
          value={paymentReference}
          onChange={(e) => setPaymentReference(e.target.value)}
          disabled={isSubmitting}
        />
      </div>

      <Textarea
        label="Customer Notes"
        sizes="xs"
        value={customerNotes}
        onChange={(e) => setCustomerNotes(e.target.value)}
        disabled={isSubmitting}
      />

      <div className="rounded-md border border-gray-200 p-3 flex flex-col gap-3">
        <p className="text-xs font-semibold text-gray-700">Add Item</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div className="md:col-span-2">
            <DropdownSelect
              name="prodVarId"
              label="Item"
              sizes="xs"
              placeholder="Select item"
              value={selectedProdVarId}
              options={variantOptions.map((v) => ({
                label: v.label,
                value: v.value,
              }))}
              onChange={handleSelectVariant}
              disabled={isSubmitting}
            />
          </div>
          <Input
            label="Quantity"
            sizes="xs"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            disabled={isSubmitting}
          />
          <Input
            label="Unit Price"
            sizes="xs"
            type="number"
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        <div className="flex justify-end">
          <Button
            label="Add Item"
            size="xs"
            color="secondary"
            hasBorder
            onClick={handleAddItem}
            disabled={isSubmitting}
          />
        </div>

        <Table
          isRounded={false}
          rowSize="h-9"
          textSize="xs"
          columns={orderItemColumns}
          data={items}
          showActions
          renderActions={(_row, index) => (
            <button
              type="button"
              className="text-red-500 hover:text-red-700"
              onClick={() => handleRemoveItem(index)}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        />

        <div className="flex justify-end text-sm font-semibold text-gray-800">
          Subtotal: {formatPeso(subtotal)}
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t pt-4">
        <Button
          label="Cancel"
          size="xs"
          color="secondary"
          hasBorder
          onClick={onCancel}
          disabled={isSubmitting}
        />
        <Button
          label="Create Order"
          size="xs"
          color="primary"
          hasBorder
          onClick={handleSubmit}
          loading={isSubmitting}
        />
      </div>
    </div>
  );
};

export default CreateOrderModal;
