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
import {
  CreateSaleDto,
  CreateSaleItemDto,
  CreateSalePaymentDto,
} from "@/dtos/sales.dto";
import Modal from "@/components/shared/Modal";
import ViewAppliedDiscountModal from "./components/ViewAppliedDiscountModal";
import toast from "react-hot-toast";
import { reportWebVitals } from "next/dist/build/templates/pages";
import CheckOutModal from "./components/CheckOutModal";
import { SalesDiscounts } from "@/types/sales-discounts";
import { CreatePaymentMethodDto } from "@/dtos/paymentMethods.dto";
import PaymentSuccessModa from "./components/PaymentSuccessModal";
import PaymentSuccessModal from "./components/PaymentSuccessModal";
import { Sales } from "@/types/sales";

export interface OrderList {
  prodVarId: number;
  prodVarName: string;
  prodVarPrice: number;
  quantity: number;
  inventoryItemId: number | null;
}

interface PosPageProps {
  storeId: number | null;
  user: UserAuth | null;
}

const PosPage = ({ storeId, user }: PosPageProps) => {
  const defaultSaleData = {
    storeId: 0,
    customerId: null,
    salesCreatedBy: 0,
    salesSubTotal: 0,
    salesTotalPaid: 0,
    salesInvoice: "",
    salesNo: "",
    salesTotalAmount: 0,
    saleDiscounts: [],
    salesItems: [],
    salesPayments: [],
  };
  const [isPaymentSuccess, setIsPaymentSuccess] = useState(false);
  const [recentSales, setRecentSales] = useState<Sales | null>(null);
  const [isShowIcons, setIsShowIcons] = useState<
    "discount" | "methods" | "product" | "history" | null
  >(null);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [saleForm, setSalesForm] = useState<CreateSaleDto>(defaultSaleData);
  const [isCheckOut, setIsCheckOut] = useState(false);
  const [selectedProduct, setSelectedProduct] =
    useState<DisplayProductsDtos | null>(null);
  const [productList, setProductList] = useState<DisplayProductsDtos[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<
    CreateSalePaymentDto[] | null
  >([]);
  const [selectedDiscount, setSelectedDiscount] = useState<
    SalesDiscounts[] | null
  >(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderList[] | null>(null);
  const { data: itemResponse = { data: [] }, mutate: mutateProducts } = useSWR<{
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
  const subtotal =
    selectedOrder?.reduce(
      (total, o) => total + o.prodVarPrice * o.quantity,
      0
    ) ?? 0;
  const totalPaid = paymentMethod?.reduce(
    (sum, p) => sum + p.salesPaymentAmount,
    0
  );
  const remaining = Math.max(0, subtotal - (totalPaid || 0));
  const change = Math.max(0, (totalPaid || 0) - subtotal);

  const canComplete = (totalPaid || 0) >= subtotal;
  const hasSufficientInventory = (
    prodVarId: number,
    quantityToAdd = 1
  ): boolean => {
    for (const product of productList) {
      const variant = product.productVariants?.find(
        (v) => v.prodVarId === prodVarId
      );

      if (!variant) continue;

      for (const vc of variant.variantComponents ?? []) {
        const required = vc.quantityRequired * quantityToAdd;
        if ((vc.left ?? 0) < required) {
          return false;
        }
      }
    }

    return true;
  };
  const getDiscount = (id: number) => {
    const discount = discountResponse?.data?.find(
      (dis) => dis.discountId === id
    );
    return discount?.discountType === "percent"
      ? `${formatDiscountValue(Number(discount?.discountValue))}`
      : `${formatPeso(Number(discount?.discountValue))}`;
  };
  const addProductOrder = (newProduct: OrderList) => {
    // ✅ Always deduct inventory
    const isAvailable = hasSufficientInventory(newProduct.prodVarId);
    if (!isAvailable) {
      toast.error("Insufficient inventory");
      return;
    }
    deductVariantComponents(newProduct.prodVarId, 1);

    setSelectedOrder((prev) => {
      if (!prev) {
        return [{ ...newProduct, quantity: 1 }];
      }

      const exists = prev.find((p) => p.prodVarId === newProduct.prodVarId);

      if (exists) {
        return prev.map((p) =>
          p.prodVarId === newProduct.prodVarId
            ? { ...p, quantity: p.quantity + 1 }
            : p
        );
      }

      return [...prev, { ...newProduct, quantity: 1 }];
    });
  };
  useEffect(() => {
    if (!selectedProduct) return;

    const updatedProduct = productList.find(
      (p) => p.prodId === selectedProduct.prodId
    );

    if (updatedProduct) {
      setSelectedProduct(updatedProduct);
    }
  }, [productList, selectedProduct?.prodId]);

  const deductVariantComponents = (prodVarId: number, quantityToAdd = 1) => {
    setProductList((prev) =>
      prev.map((product) => ({
        ...product,
        productVariants: product.productVariants?.map((variant) => {
          if (variant.prodVarId !== prodVarId) return variant;

          return {
            ...variant,
            variantComponents: variant.variantComponents?.map((vc) => ({
              ...vc,
              left: (vc.left ?? 0) - vc.quantityRequired * quantityToAdd,
            })),
          };
        }),
      }))
    );
  };
  const restoreVariantComponents = (
    prodVarId: number,
    quantityToRestore = 1
  ) => {
    setProductList((prev) =>
      prev.map((product) => ({
        ...product,
        productVariants: product.productVariants?.map((variant) => {
          if (variant.prodVarId !== prodVarId) return variant;

          return {
            ...variant,
            variantComponents: variant.variantComponents?.map((vc) => ({
              ...vc,
              left: (vc.left ?? 0) + vc.quantityRequired * quantityToRestore,
            })),
          };
        }),
      }))
    );
  };
  const removeQuantityProductList = (product: OrderList) => {
    restoreVariantComponents(product.prodVarId, 1);
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
    const isAvailable = hasSufficientInventory(product.prodVarId);
    console.log({});
    if (!isAvailable) {
      toast.error("Insufficient inventory");
      return;
    }
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
  function getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()!.split(";").shift() || null;
    return null;
  }
  const handleConfirmOrder = async () => {
    console.log({ user });
    const token = getCookie("avdc_accessToken");
    console.log({ token });
    if (!selectedOrder || selectedOrder.length === 0) {
      toast.error("No selected order!");
      return;
    }
    if (!storeId || storeId === 0) {
      toast.error("No store found!");
      return;
    }
    const saleItems: CreateSaleItemDto[] =
      selectedOrder?.map((items) => ({
        inventoryItemId: items.inventoryItemId || null,
        salesItemPrice: items.prodVarPrice,
        salesItemQuantity: items.quantity,
        salesId: 0,
        salesItemSubtotal: Number(items.quantity) * Number(items.prodVarPrice),
        prodVarId: items.prodVarId,
      })) ?? [];
    const paymentMethodData: CreateSalePaymentDto[] =
      paymentMethod?.map((pm) => ({
        paymentReference: pm.paymentReference,
        salesId: 0,
        salesPaymentAmount: pm.salesPaymentAmount,
        payMetId: pm.payMetId,
        salesPaymentStatus: "completed",
      })) ?? [];
    const salesData: CreateSaleDto = {
      customerId: 0,
      salesInvoice: "",
      salesCreatedBy: user?.userId ?? 0,
      salesNo: "",
      salesTotalAmount: getTotalAmount(),
      storeId: user?.storeId ?? 0,
      salesSubTotal: subtotal,
      salesTotalPaid: totalPaid ?? 0,
      saleDiscounts: [],
      salesItems: saleItems,
      salesPayments: paymentMethodData,
    };
    try {
      const result = await fetch(`api/sales/pos/${salesData.storeId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(salesData),
      });
      const res = await result.json();
      if (!res.success) {
        console.log("Res: ", res);
        throw new Error(res.err);
      }
      const sales = res.data as Sales[];
      console.log({ sales });
      setRecentSales(sales[0]);
      toast.success("Request created successfully!");
      mutateProducts();
      setIsPaymentSuccess(true);
      setPaymentMethod([]);
      setSelectedOrder([]);
      setSelectedDiscount([]);
      return true;
    } catch (e) {
      console.log(e);
      toast.error("Failed to add Inventory.");
      return false;
    }
  };

  // const addPayment = (payment: CreateSalePaymentDto) => {
  //   console.log({ payment });
  //   setPaymentMethod((prev) => {
  //     const existing = prev?.some((p) => p.payMetId === payment.payMetId);
  //     if (existing) {
  //       // Payment already added → do nothing
  //       return prev;
  //     }

  //     // Add new payment
  //     return [
  //       ...(prev ?? []),
  //       {
  //         paymentReference: payment.paymentReference,
  //         payMetId: payment.payMetId,
  //         salesPaymentAmount: payment.salesPaymentAmount,
  //         salesId: 0,
  //       },
  //     ];
  //   });
  // };
  const addPayment = (payment: CreateSalePaymentDto) => {
    setPaymentMethod((prev) => [
      ...(prev ?? []),
      {
        paymentReference: payment.paymentReference,
        payMetId: payment.payMetId,
        salesPaymentAmount: payment.salesPaymentAmount,
        salesId: 0,
        salesPaymentStatus: "completed",
      },
    ]);
  };
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
            {/* <div className="flex justify-between">
              <span className="text-sm  text-gray-400">
                Discount({getDiscount(1)})
              </span>
              <span className="text-sm  text-gray-400">
                {formatPeso(getTotalAmount() * 0.1)}
              </span>
            </div> */}
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
              label="Check Out"
              className="w-full"
              onClick={() => {
                const hasNoOrder =
                  !selectedOrder || selectedOrder?.length === 0;
                console.log({ hasNoOrder, selectedOrder });
                if (hasNoOrder) {
                  toast.error("No order selected!");
                  return;
                }
                setIsCheckOut(true);
              }}
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
      <Modal
        leftTitleContent={
          isPaymentSuccess ? (
            <div></div>
          ) : (
            <span className="font-semibold">
              Total: {formatPeso(getTotalAmount())}
            </span>
          )
        }
        className={isPaymentSuccess ? `` : `h-[95%]`}
        isOpen={isCheckOut}
        onClose={function (): void {
          setIsCheckOut(false);
          if (isPaymentSuccess) {
            setIsPaymentSuccess(false);
            setRecentSales(null);
          }
        }}
        size="lg"
        modalDetails={
          isPaymentSuccess ? (
            <div></div>
          ) : (
            <div className="flex justify-between w-full">
              <span className="text-lg font-semibold"> Confirm Order</span>
              <span className="font-semibold py-2 px-1.5 border border-gray-300 rounded-lg">
                Total: {formatPeso(getTotalAmount())}
              </span>
            </div>
          )
        }
      >
        {!isPaymentSuccess ? (
          <CheckOutModal
            addPayment={addPayment}
            order={selectedOrder}
            discounts={selectedDiscount}
            paymentMethods={paymentMethodResponse.data ?? []}
            selectedPaymentMethod={paymentMethod}
            setSelectedPaymentMethod={setPaymentMethod}
            handleCompleteSale={handleConfirmOrder}
            totalPaid={totalPaid ?? 0}
            subtotal={subtotal}
            remaining={remaining}
            change={change}
            canComplete={canComplete}
          />
        ) : (
          <PaymentSuccessModal
            totalPaid={recentSales?.salesTotalPaid ?? 0}
            change={
              (Number(recentSales?.salesTotalPaid) ?? 0) -
              (Number(recentSales?.salesTotalAmount) ?? 0)
            }
            onNewSale={() => {
              setIsPaymentSuccess(false);
              setRecentSales(null);
              setIsCheckOut(false);
            }}
            onPrintReceipt={() => {
              console.log("Print Sales");
            }}
            salesData={recentSales}
          />
        )}
      </Modal>
    </PageLayout>
  );
};

export default PosPage;
