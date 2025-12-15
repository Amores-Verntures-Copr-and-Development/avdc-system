"use client";

import PageLayout from "@/components/shared/PageLayout";
import React, { useEffect, useState } from "react";

import Button from "@/components/shared/Button";
import { Files, History, PhilippinePesoIcon, Receipt } from "lucide-react";
import IconButton from "@/components/shared/IconButton";
import { DisplayProductsDtos } from "@/dtos/products.dto";
import { UserAuth } from "@/hooks/useSession";

import { fetcher } from "@/utils/fetcher";
import useSWR from "swr";
import ProductContent from "./components/layout/ProductContent";

import DropdownSelect from "@/components/shared/DropdownSelect";
import { paymentMethodOptions } from "@/constants/dropdown-options";

import ProductVariant from "./components/layout/ProductVariant";
import { ProductVariants } from "@/types/products";
import OrderDetails from "./components/layout/OrderDetails";
import { formatPeso } from "@/utils/formatPeso";

export interface OrderList {
  prodVarId: number;
  prodVarName: string;
  prodVarPrice: number;
  quantity: number;
}

interface PosPageProps {
  storeId: number | null;
  user: UserAuth | null;
}

const PosPage = ({ storeId, user }: PosPageProps) => {
  const [selectedProduct, setSelectedProduct] =
    useState<DisplayProductsDtos | null>(null);
  const [productList, setProductList] = useState<DisplayProductsDtos[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderList[] | null>(null);
  const { data: itemResponse = { data: [] } } = useSWR<{
    data: DisplayProductsDtos[];
  }>(storeId ? `/api/products/${storeId}` : null, fetcher);
  useEffect(() => {
    if (itemResponse.data && itemResponse.data.length > 0) {
      setProductList(itemResponse.data);
    }
  }, [itemResponse.data]);
  const addProductOrder = (newProduct: OrderList) => {
    console.log({ newProduct });
    const exists = selectedOrder?.find(
      (p) => p.prodVarId === newProduct.prodVarId
    );
    console.log({ exists });
    if (exists) {
      // ✅ Deduct 1 from inventory first
      // removeQuantityProductList(exists);

      // ✅ Then update selected products
      setSelectedOrder((prev) =>
        prev
          ? prev.map((p) =>
              p.prodVarId === newProduct.prodVarId
                ? { ...p, quantity: (p.quantity || 0) + 1 }
                : p
            )
          : null
      );
    } else {
      // ✅ Deduct inventory for a new product
      removeQuantityProductList(newProduct);

      setSelectedOrder((prev) => [
        ...(prev ?? []), // <-- if null, use empty array
        { ...newProduct, quantity: 1 },
      ]);
    }
  };

  const removeQuantityProductList = (product: OrderList) => {
    setSelectedOrder((prev) => {
      if (!prev) return null;

      return prev
        .map((p) =>
          p.prodVarId === product.prodVarId
            ? {
                ...p,
                quantity: Math.max((p.quantity || 0) - 1, 0),
              }
            : p
        )
        .filter((p) => p.quantity > 0); // ✅ remove items with 0 quantity
    });
  };
  const addQuantity = (product: OrderList) => {
    setSelectedOrder((prev) => {
      if (!prev) {
        // if empty, add product with quantity 1
        return [
          {
            ...product,
            quantity: 1,
          },
        ];
      }

      const exists = prev.some((p) => p.prodVarId === product.prodVarId);

      if (!exists) {
        // if not in list, add it
        return [
          ...prev,
          {
            ...product,
            quantity: 1,
          },
        ];
      }

      // if exists, increase quantity
      return prev.map((p) =>
        p.prodVarId === product.prodVarId
          ? {
              ...p,
              quantity: (p.quantity || 0) + 1,
            }
          : p
      );
    });
  };
  // const removeQuantity = (product: DisplayProductsDtos) => {};
  const getTotalAmount = (): number => {
    return (
      selectedOrder?.reduce((total, prod) => {
        const price = Number(prod.prodVarPrice) || 0;
        const qty = Number(prod.quantity) || 0;
        return total + price * qty;
      }, 0) ?? 0
    );
  };
  // const handleSubmitOrder = async () => {
  //   const modifyProduct: CreateSaleItemDto[] = selectedProduct.map((prod) => ({
  //     inventoryItemId: prod.inventoryItemId,
  //     saleItemPrice: prod.productPrice,
  //     saleItemQuantity: prod.quantity,
  //     saleItemSubtotal: prod.productPrice * prod.quantity,
  //     salesId: 0,
  //   }));
  //   const modifyPayments: CreateSalePaymentDto[] = [
  //     {
  //       salesId: 0,
  //       paymentReference: "TEST",
  //       salesPaymentAmount: getTotalAmount(),
  //       salesPaymentMethod: "cash",
  //     },
  //   ];
  //   // ✅ Build the new order object first
  //   const newOrderForm = {
  //     customerId: null,
  //     salesCreatedBy: user?.userId ?? 0,
  //     storeId: user?.storeId ?? 0,
  //     salesTotalAmount: getTotalAmount(),
  //     salePayments: modifyPayments,
  //     salesItems: modifyProduct,
  //     receiptNo: "",
  //   };

  //   try {
  //     const res = await fetch(`api/sales/pos/${newOrderForm.storeId}`, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify(newOrderForm),
  //     });

  //     const result = await res.json();

  //     if (!result.success) {
  //       console.log(result.error);
  //       throw new Error(result.message || "Failed to process order");
  //     }

  //     mutate();
  //     setSelectedProduct([]);
  //     toast.success(
  //       `Order ${result.data.receiptNo} is successfully processed!`
  //     );
  //   } catch (e) {
  //     console.error(e);
  //     toast.error("Failed to process order!");
  //   }
  // };
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
                  color="secondary"
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
          {selectedProduct ? (
            <ProductVariant
              addQuantity={addQuantity}
              data={selectedProduct}
              onClick={function (data: ProductVariants): void {
                throw new Error("Function not implemented.");
              }}
              onBack={() => {
                setSelectedProduct(null);
              }}
              addProductOrder={addProductOrder}
            />
          ) : (
            <ProductContent
              data={productList ?? []}
              selectProduct={(data) => {
                setSelectedProduct(data);
              }}
              addProductOrder={addProductOrder}
            />
          )}
        </div>

        <div className="flex-[0.25] flex flex-col justify-between bg-white h-full border border-gray-200">
          <div className="flex-[0.05] border-b p-2 border-gray-200 flex justify-between">
            <h1 className="font-semibold">Order Details</h1>
          </div>

          <div className="flex-1 p-2 overflow-auto">
            <OrderDetails
              data={selectedOrder}
              removeQuantityProductList={removeQuantityProductList}
              addQuantity={addQuantity}
            />
          </div>
          <div className="flex-[0.25] p-5 border-gray-200 flex flex-col gap-4">
            <div className="flex items-center gap-3 pb-2 border-b-2 border-gray-200">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-1/80 to-primary-1/70 flex items-center justify-center shadow-md">
                <Receipt className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-800">
                Payment Details
              </h1>
            </div>
            <div className="flex gap-2">
              <DropdownSelect
                sizes="sm"
                name={""}
                value={undefined}
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
              <span className="text-sm  text-gray-400">Discount(10%)</span>
              <span className="text-sm  text-gray-400">
                {formatPeso(getTotalAmount() * 0.1)}
              </span>
            </div>
            <div className="flex justify-between border-t border-gray-200 py-2">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-sm font-semibold">
                <span className="text-sm font-semibold">
                  {formatPeso(getTotalAmount())}
                </span>
              </span>
            </div>
          </div>
          {/* Footer / bottom button */}
          <div className="p-2 border-t border-gray-200">
            <Button
              size="sm"
              label="Make Order"
              className="w-full"
              // onClick={() => {
              //   handleSubmitOrder();
              // }}
            />
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default PosPage;
