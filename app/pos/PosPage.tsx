"use client";

import PageLayout from "@/components/shared/PageLayout";
import React, { useEffect, useState } from "react";

import Button from "@/components/shared/Button";
import {
  ArrowLeft,
  CardSim,
  CreditCard,
  Files,
  History,
  Package,
  PhilippinePesoIcon,
  Receipt,
  Tag,
  TicketPercent,
} from "lucide-react";
import IconButton from "@/components/shared/IconButton";
import { DisplayProductsDtos } from "@/dtos/products.dto";
import { UserAuth } from "@/hooks/useSession";

import { fetcher } from "@/utils/fetcher";
import useSWR from "swr";
import ProductContent from "./components/layout/ProductContent";

import DropdownSelect from "@/components/shared/DropdownSelect";
import {
  paymentDiscount,
  paymentMethodOptions,
} from "@/constants/dropdown-options";

import ProductVariant from "./components/layout/ProductVariant";
import { ProductVariants } from "@/types/products";
import OrderDetails from "./components/layout/OrderDetails";
import { formatPeso } from "@/utils/formatPeso";
import Popup from "@/components/shared/Popup";
import DiscountList, {
  formatDiscountValue,
} from "./components/sidebar/DiscountList";
import PaymentMethodList from "./components/sidebar/PaymentMethodList";
import ProductList from "./components/sidebar/ProductList";
import SalesHistory from "./components/sidebar/SalesHistory";
import Card from "@/components/shared/Card";
import { Discounts } from "@/types/discount";
import { PaymentMethods } from "@/types/payment-methods";
import { CreateSaleDto } from "@/dtos/sales.dto";
import Modal from "@/components/shared/Modal";
import ViewAppliedDiscountModal from "./components/ViewAppliedDiscountModal";

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
  const [isShowIcons, setIsShowIcons] = useState<
    "discount" | "methods" | "product" | "history" | null
  >(null);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [saleForm, setSalesForm] = useState<CreateSaleDto>({
    storeId: 0,
    customerId: null,
    salesCreatedBy: 0,
    salesInvoice: "",
    salesNo: "",
    salesTotalAmount: 0,
  });
  const [selectedProduct, setSelectedProduct] =
    useState<DisplayProductsDtos | null>(null);
  const [productList, setProductList] = useState<DisplayProductsDtos[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderList[] | null>(null);
  const { data: itemResponse = { data: [] } } = useSWR<{
    data: DisplayProductsDtos[];
  }>(storeId ? `/api/products/${storeId}` : null, fetcher);
  const {
    data: paymentMethodResponse = { data: [] },
    isLoading: isPaymentloading,
    mutate: mutatePaymentMethod,
  } = useSWR<{
    data: PaymentMethods[];
  }>(storeId ? `/api/payment-method/store/${storeId}/` : null, fetcher);
  const {
    data: discountResponse = { data: [] },
    isLoading: loading,
    mutate,
  } = useSWR<{
    data: Discounts[];
  }>(storeId ? `/api/sales-discount/store/${storeId}/` : null, fetcher);

  useEffect(() => {
    if (itemResponse.data && itemResponse.data.length > 0) {
      setProductList(itemResponse.data);
    }
  }, [itemResponse.data]);
  const paymentMethodOptions = [
    { label: "Select Payment Method", value: 0 },
    ...(paymentMethodResponse?.data?.map((payMet) => ({
      label: payMet.payMetName,
      value: payMet.payMetId,
    })) ?? []),
  ];

  const getDiscount = (id: number) => {
    const discount = discountResponse?.data?.find(
      (dis) => dis.discountId === id
    );
    return discount?.discountType === "percent"
      ? `${formatDiscountValue(Number(discount?.discountValue))}`
      : `${formatPeso(Number(discount?.discountValue))}`;
  };
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
  const removeProduct = (product: OrderList) => {
    const newSelectedOrder = selectedOrder?.filter(
      (prod) => prod.prodVarId !== product.prodVarId
    );
    setSelectedOrder(newSelectedOrder ?? []);
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
          <div className="bg-white h-15 border border-gray-200 flex justify-between items-center px-4 py-2 overflow-visible">
            {selectedProduct ? (
              <>
                {/* Product Detail Header */}
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-primary-1 to-primary-1/50 rounded-lg shadow-sm">
                    <Package className="text-white w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold text-gray-900">
                      {selectedProduct.prodName}
                    </h1>
                    <p className="text-xs text-gray-500">
                      {selectedProduct.productVariants?.length || 0} variant
                      {selectedProduct.productVariants?.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <div>
                  {" "}
                  <Button
                    label="Back"
                    size="sm"
                    icon={<ArrowLeft className="w-3 h-3" />}
                    onClick={() => setSelectedProduct(null)}
                  />
                </div>
              </>
            ) : (
              <>
                {/* Main Header */}
                <div className="flex items-center">
                  <h1 className="text-lg font-semibold text-gray-900 mr-5">
                    Products
                  </h1>
                  <div className="flex gap-2">
                    <div>
                      {" "}
                      <Button size="xs" label="All" />
                    </div>
                    <div>
                      {" "}
                      <Button size="xs" label="All" />
                    </div>
                    <div>
                      {" "}
                      <Button size="xs" label="All" />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <IconButton
                    onClick={() => {
                      setIsShowIcons("methods");
                      console.log("Product list clicked");
                    }}
                    label="Payment Method List"
                    bg="green"
                    icon={<CreditCard size={15} />}
                    isRounded={false}
                  />
                  <IconButton
                    onClick={() => {
                      setIsShowIcons("discount");
                      // TODO: Implement product list functionality
                      console.log("Product list clicked");
                    }}
                    label="Discount List"
                    bg="blue"
                    icon={<TicketPercent size={15} />}
                    isRounded={false}
                  />
                  <IconButton
                    onClick={() => {
                      setIsShowIcons("product");
                      console.log("Product list clicked");
                    }}
                    label="Product List"
                    bg="yellow"
                    icon={<Files size={15} />}
                    isRounded={false}
                  />

                  <IconButton
                    onClick={() => {
                      setIsShowIcons("history");
                      console.log("History clicked");
                    }}
                    label="History"
                    bg="primary"
                    icon={<History size={15} />}
                    isRounded={false}
                  />
                </div>
              </>
            )}
          </div>
          {selectedProduct ? (
            <ProductVariant
              addQuantity={addQuantity}
              data={selectedProduct}
              onClick={function (data: ProductVariants): void {
                console.log({ data });
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
          <div className="flex-[0.05] border-b p-2 border-gray-200 flex justify-between items-center">
            <h1 className="font-semibold">Order Details</h1>
            <span className="text-sm font-semibold">
              {selectedOrder?.length} items
            </span>
          </div>
          <div className="flex-[0.05] border-b p-2 border-gray-200 flex  items-center gap-5">
            <h1 className="font-semibold text-sm">Customer:</h1>
            {/* <div className="flex-1">
              <DropdownSearch
                sizes="xs"
                placeholder="Search customer"
                searchFn={function (query: string): Promise<unknown[]> {
                  throw new Error("Function not implemented.");
                }}
                onSelect={function (item: unknown): void {
                  throw new Error("Function not implemented.");
                }}
                renderItem={function (item: unknown): React.ReactNode {
                  throw new Error("Function not implemented.");
                }}
                displayValue={function (item: unknown): string {
                  throw new Error("Function not implemented.");
                }}
              />
            </div> */}
          </div>

          <div className="flex-1 p-2 overflow-auto">
            <OrderDetails
              data={selectedOrder}
              removeQuantityProductList={removeQuantityProductList}
              addQuantity={addQuantity}
              removeProduct={removeProduct}
            />
          </div>
          <div className="flex-[0.25] p-5 border-gray-200 flex flex-col gap-4">
            <div className="flex items-center gap-3 pb-2 border-b-2 border-gray-200 justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-1/80 to-primary-1/70 flex items-center justify-center shadow-md">
                  <Receipt className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-md font-bold text-gray-800">
                  Payment Details
                </h1>
              </div>
              <div>
                <Button
                  icon={<Tag className="w-3 h-3 xl:h-4 xl:w-4" />}
                  size="xs"
                  label="Discount"
                  onClick={() => {
                    setShowDiscountModal(true);
                  }}
                  color="secondary"
                />
              </div>
            </div>

            <div className="flex justify-between">
              <span className="text-sm  text-gray-400">Subtotal</span>
              <span className="text-sm  text-gray-400">
                {formatPeso(getTotalAmount())}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm  text-gray-400">
                Discount({getDiscount(1)})
              </span>
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
      <Popup
        title={
          isShowIcons === "discount"
            ? "Discount List"
            : isShowIcons === "methods"
            ? "Payment Method List"
            : isShowIcons === "product"
            ? "Product List"
            : isShowIcons === "history"
            ? "Sales History"
            : ""
        }
        isOpen={isShowIcons !== null}
        onClose={function (): void {
          setIsShowIcons(null);
        }}
        background="transparent"
      >
        {isShowIcons === "discount" ? (
          <DiscountList storeId={storeId} user={user} />
        ) : isShowIcons === "methods" ? (
          <PaymentMethodList storeId={storeId} user={user} />
        ) : isShowIcons === "product" ? (
          <ProductList />
        ) : isShowIcons === "history" ? (
          <SalesHistory />
        ) : (
          ""
        )}
      </Popup>
      <Modal
        leadingIcon={Tag}
        title="Apply Discount"
        isOpen={showDiscountModal}
        onClose={function (): void {
          setShowDiscountModal(false);
        }}
      >
        <ViewAppliedDiscountModal discountData={discountResponse.data ?? []} />
      </Modal>
    </PageLayout>
  );
};

export default PosPage;
