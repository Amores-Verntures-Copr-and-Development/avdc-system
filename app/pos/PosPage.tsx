"use client";

import PageHeader from "@/components/shared/PageHeader";
import PageLayout from "@/components/shared/PageLayout";
import React, { useEffect, useState } from "react";
import ProductCard from "./components/ProductCard";
import Button from "@/components/shared/Button";
import {
  Files,
  History,
  PhilippinePesoIcon,
  Plus,
  Receipt,
} from "lucide-react";
import IconButton from "@/components/shared/IconButton";
import { DisplayProductsDtos } from "@/dtos/products.dto";
import { useSession } from "@/hooks/useSession";
import { InventoryInterface } from "@/types/inventory";
import { fetcher } from "@/utils/fetcher";
import useSWR from "swr";
import ProductContent from "./components/layout/ProductContent";
import OrderDetails from "./components/layout/OrderDetails";
import { formatPeso } from "@/utils/formatPeso";
import Modal from "@/components/shared/Modal";
import DropdownSelect from "@/components/shared/DropdownSelect";
import { paymentMethodOptions } from "@/constants/dropdown-options";
import {
  CreateSaleDto,
  CreateSaleItemDto,
  CreateSalePaymentDto,
} from "@/dtos/sales.dto";
import toast from "react-hot-toast";

export interface OrderProduct extends DisplayProductsDtos {
  quantity: number;
}

const PosPage = () => {
  const [inventoryId, setInventoryId] = useState(0);
  const { user, loading: userLoading, hasStore } = useSession();
  const [showMakeOrder, setShowMakeOrder] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<OrderProduct[]>([]);
  const [productList, setProductList] = useState<DisplayProductsDtos[]>([]);
  const inventoryBaseUrl = hasStore
    ? `/api/inventory/${user?.storeId}`
    : `/api/inventory`;
  const {
    data: inventoryResponse = { data: [] },
    isLoading,
    mutate: mutateInventory,
  } = useSWR<{ data: InventoryInterface[] }>(inventoryBaseUrl, fetcher);
  useEffect(() => {
    if (
      inventoryResponse &&
      Array.isArray(inventoryResponse.data) &&
      inventoryResponse.data.length > 0
    ) {
      setInventoryId(inventoryResponse.data[0].inventoryId);
    }
  }, [inventoryResponse]);
  const {
    data: itemResponse = { data: [] },
    isLoading: loading,
    mutate,
  } = useSWR<{ data: DisplayProductsDtos[] }>(
    inventoryId ? `/api/products/${inventoryId}` : null,
    fetcher
  );
  useEffect(() => {
    if (
      itemResponse &&
      Array.isArray(itemResponse.data) &&
      itemResponse.data.length > 0
    ) {
      setProductList(itemResponse.data);
    }
  }, [itemResponse]);
  const addProductOrder = (newProduct: DisplayProductsDtos) => {
    const exists = selectedProduct.find(
      (p) => p.productId === newProduct.productId
    );

    if (exists) {
      // ✅ Deduct 1 from inventory first
      removeQuantityProductList(exists);

      // ✅ Then update selected products
      setSelectedProduct((prev) =>
        prev.map((p) =>
          p.productId === newProduct.productId
            ? { ...p, quantity: (p.quantity || 0) + 1 }
            : p
        )
      );
    } else {
      // ✅ Deduct inventory for a new product
      removeQuantityProductList(newProduct);

      setSelectedProduct((prev) => [...prev, { ...newProduct, quantity: 1 }]);
    }

    console.log("SelectedProduct:", selectedProduct);
  };
  const removeQuantityProductList = (product: DisplayProductsDtos) => {
    setProductList((prev) =>
      prev.map((p) =>
        p.productId === product.productId
          ? {
              ...p,
              inventoryItemQuantity: Math.max(
                (p.inventoryItemQuantity || 0) - 1,
                0
              ), // ✅ deduct 1, prevent negative
            }
          : p
      )
    );
  };
  const addQuantity = (product: DisplayProductsDtos) => {};
  const removeQuantity = (product: DisplayProductsDtos) => {};
  const getTotalAmount = () => {
    return selectedProduct.reduce((total, prod) => {
      const price = Number(prod.productPrice) || 0;
      const qty = Number(prod.quantity) || 0;
      return total + price * qty;
    }, 0);
  };
  const handleSubmitOrder = async () => {
    const modifyProduct: CreateSaleItemDto[] = selectedProduct.map((prod) => ({
      inventoryItemId: prod.inventoryItemId,
      saleItemPrice: prod.productPrice,
      saleItemQuantity: prod.quantity,
      saleItemSubtotal: prod.productPrice * prod.quantity,
      salesId: 0,
    }));
    const modifyPayments: CreateSalePaymentDto[] = [
      {
        salesId: 0,
        paymentReference: "TEST",
        salesPaymentAmount: getTotalAmount(),
        salesPaymentMethod: "cash",
      },
    ];
    // ✅ Build the new order object first
    const newOrderForm = {
      customerId: null,
      salesCreatedBy: user?.userId ?? 0,
      storeId: user?.storeId ?? 0,
      salesTotalAmount: getTotalAmount(),
      salePayments: modifyPayments,
      salesItems: modifyProduct,
      receiptNo: "",
    };

    try {
      const res = await fetch(`api/sales/pos/${newOrderForm.storeId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newOrderForm),
      });

      const result = await res.json();

      if (!result.success) {
        console.log(result.error);
        throw new Error(result.message || "Failed to process order");
      }

      mutate();
      setSelectedProduct([]);
      toast.success(
        `Order ${result.data.receiptNo} is successfully processed!`
      );
    } catch (e) {
      console.error(e);
      toast.error("Failed to process order!");
    }
  };
  return (
    <PageLayout>
      <div className="flex flex-1 overflow-visible h-full">
        {/* Left section */}
        <div className="flex flex-col flex-[0.75] h-full">
          <div className="bg-white h-15 border border-gray-200 flex justify-end items-center p-2 overflow-visible">
            <div className="flex gap-2">
              <div>
                <IconButton
                  onClick={function (): void {
                    throw new Error("Function not implemented.");
                  }}
                  label={"Product List"}
                  bg={""}
                  icon={<Files size={15} />}
                  isRounded={false}
                />
                {/* <Button
                  size="xs"
                  isRounded={false}
                  icon={<Plus size={15} />}
                  color="nocolor"
                  label=""
                /> */}
              </div>
              <div>
                <IconButton
                  onClick={function (): void {
                    throw new Error("Function not implemented.");
                  }}
                  label={"History"}
                  bg={""}
                  icon={<History size={15} />}
                  isRounded={false}
                />
              </div>
            </div>
          </div>
          <ProductContent
            data={productList}
            addProductOrder={addProductOrder}
            selectedProduct={selectedProduct}
          />
        </div>

        {/* Right section */}
        <div className="flex-[0.25] flex flex-col justify-between bg-white h-full border border-gray-200">
          {/* Header */}
          <div className="flex-[0.05] border-b p-2 border-gray-200 flex justify-between">
            <h1 className="font-semibold">Order Details</h1>
            <span className="text-sm">{selectedProduct.length} item(s)</span>
          </div>

          {/* Middle content */}
          <div className="flex-1 p-2 overflow-auto">
            <OrderDetails data={selectedProduct} />
          </div>
          <div className="flex-[0.25] p-5 border-gray-200 flex flex-col gap-4">
            <h1 className="border-b border-gray-200  py-2">Payment Details</h1>
            <div className="flex gap-2">
              <DropdownSelect
                sizes="sm"
                name={""}
                value={undefined}
                onChange={function (
                  e: React.ChangeEvent<HTMLSelectElement>
                ): void {
                  throw new Error("Function not implemented.");
                }}
                options={paymentMethodOptions}
              />
              <IconButton
                onClick={function (): void {
                  throw new Error("Function not implemented.");
                }}
                label={"Split Payment"}
                bg={"gray"}
                icon={<PhilippinePesoIcon size={20} />}
              />
            </div>
            <div className="flex justify-between">
              <span className="text-sm  text-gray-400">Subtotal</span>
              <span className="text-sm  text-gray-400">
                {formatPeso(getTotalAmount())}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm  text-gray-400">Tax(10%)</span>
              <span className="text-sm  text-gray-400">
                {formatPeso(getTotalAmount() * 0.1)}
              </span>
            </div>
            <div className="flex justify-between border-t border-gray-200 py-2">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-sm font-semibold">
                {formatPeso(getTotalAmount() + getTotalAmount() * 0.1)}
              </span>
            </div>
          </div>
          {/* Footer / bottom button */}
          <div className="p-2 border-t border-gray-200">
            <Button
              size="sm"
              label="Make Order"
              className="w-full"
              onClick={() => {
                handleSubmitOrder();
              }}
            />
          </div>
        </div>
      </div>
      <Modal
        isOpen={false}
        onClose={function (): void {
          throw new Error("Function not implemented.");
        }}
        children={undefined}
      />
    </PageLayout>
  );
};

export default PosPage;
