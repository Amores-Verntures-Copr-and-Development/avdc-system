"use client";

import PageLayout from "@/components/shared/PageLayout";
import React, { useEffect, useMemo, useState } from "react";

import Button from "@/components/shared/Button";
import {
  ArrowLeft,
  CreditCard,
  Files,
  Filter,
  History,
  Layers2,
  Package,
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
import DiscountList from "./components/sidebar/DiscountList";
import PaymentMethodList from "./components/sidebar/PaymentMethodList";
import ProductList from "./components/sidebar/ProductList";
import SalesHistory from "./components/sidebar/SalesHistory";
import { Discounts } from "@/types/discount";
import { PaymentMethods } from "@/types/payment-methods";
import {
  CreateSaleDto,
  CreateSaleItemDto,
  CreateSalePaymentDto,
  CreateSalesDiscount,
} from "@/dtos/sales.dto";
import Modal from "@/components/shared/Modal";
import ViewAppliedDiscountModal from "./components/ViewAppliedDiscountModal";
import toast from "react-hot-toast";

import CheckOutModal from "./components/CheckOutModal";
import PaymentSuccessModal from "./components/PaymentSuccessModal";
import { Sales } from "@/types/sales";
import { DropdownSearch } from "@/components/shared/DropDownSearch";
import { Customer } from "@/types/customer";
import { selectProductVariants } from "@/models/productModel";
import SearchBar from "@/components/shared/SearchBar";

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
  const [clearSignal, setClearSignal] = useState(0);
  const handleClearCustomerComponent = () => {
    setClearSignal((prev) => prev + 1);
    setCustomer(null);
  };
  const [showProductView, setShowProductView] = useState<
    "product" | "product-variant"
  >("product");
  const [categoryFilter, setCategoryFilter] = useState<string | "all">("all");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isPaymentSuccess, setIsPaymentSuccess] = useState(false);
  const [recentSales, setRecentSales] = useState<Sales | null>(null);
  const [isShowIcons, setIsShowIcons] = useState<
    "discount" | "methods" | "product" | "history" | null
  >(null);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [isCheckOut, setIsCheckOut] = useState(false);
  const [selectedProduct, setSelectedProduct] =
    useState<DisplayProductsDtos | null>(null);
  const [productList, setProductList] = useState<DisplayProductsDtos[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<
    CreateSalePaymentDto[] | null
  >([]);
  const [selectedDiscount, setSelectedDiscount] = useState<
    CreateSalesDiscount[] | null
  >(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderList[] | null>(null);
  const { data: itemResponse = { data: [] }, mutate: mutateProducts } = useSWR<{
    data: DisplayProductsDtos[];
  }>(storeId ? `/api/products/${storeId}` : null, fetcher);
  const { data: paymentMethodResponse = { data: [] } } = useSWR<{
    data: PaymentMethods[];
  }>(storeId ? `/api/payment-method/store/${storeId}/` : null, fetcher);
  const { data: discountResponse = { data: [] } } = useSWR<{
    data: Discounts[];
  }>(storeId ? `/api/sales-discount/store/${storeId}/` : null, fetcher);
  console.log({ itemResponse });
  useEffect(() => {
    if (itemResponse.data && itemResponse.data.length > 0) {
      setProductList(itemResponse.data ?? []);
    } else {
      setProductList([]);
    }
  }, [itemResponse.data?.length]);

  // Reset selectedDiscount when discountResponse changes
  // useEffect(() => {
  //   const noDiscounts =
  //     !discountResponse?.data || discountResponse.data.length === 0;

  //   // Only reset if selectedDiscount is not already null
  //   if (noDiscounts && selectedDiscount !== null) {
  //     console.log("Reset discounts");
  //     setSelectedDiscount(null);
  //   }
  // }, [discountResponse.data, selectedDiscount]);

  const subtotal = useMemo(() => {
    return (
      selectedOrder?.reduce((t, o) => t + o.prodVarPrice * o.quantity, 0) ?? 0
    );
  }, [selectedOrder]);
  const totalPaid = paymentMethod?.reduce(
    (sum, p) => sum + p.salesPaymentAmount,
    0,
  );
  const getTotalAmount = (): number => {
    if (!selectedDiscount || selectedDiscount.length === 0) return subtotal;

    const totalDiscount = selectedDiscount.reduce(
      (acc, disc) => acc + disc.discountAmount,
      0,
    );

    return Math.max(subtotal - totalDiscount, 0); // prevent negative
  };
  const remaining = Math.max(0, getTotalAmount() - (totalPaid || 0));
  const change = Math.max(0, (totalPaid || 0) - getTotalAmount());

  const canComplete = (totalPaid || 0) >= getTotalAmount();
  const hasSufficientInventory = (
    prodVarId: number,
    quantityToAdd = 1,
  ): boolean => {
    for (const product of productList) {
      const variant = product.productVariants?.find(
        (v) => v.prodVarId === prodVarId,
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
            : p,
        );
      }

      return [...prev, { ...newProduct, quantity: 1 }];
    });
  };
  useEffect(() => {
    if (!selectedProduct) return;

    const updatedProduct = productList.find(
      (p) => p.prodId === selectedProduct.prodId,
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
      })),
    );
  };
  const restoreVariantComponents = (
    prodVarId: number,
    quantityToRestore = 1,
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
      })),
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
            : p,
        )
        .filter((p) => p.quantity > 0); // ✅ remove items with 0 quantity
    });
  };
  useEffect(() => {
    setSelectedDiscount(
      (prev) =>
        prev?.map((d) => {
          const disc = getDiscountMeta(d.discountId);
          return {
            ...d,
            discountAmount:
              disc?.discountType === "fixed"
                ? disc.discountValue
                : Math.max(0, subtotal * (Number(disc?.discountValue) / 100)), // or the field you want to reset
          };
        }) || [],
    );
  }, [subtotal]);
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
          : p,
      );
    });
  };
  // const removeQuantity = (product: DisplayProductsDtos) => {};
  const productCategoriesList = useMemo(() => {
    return Array.from(
      new Set(
        productList
          .filter((p) => p.prodCatId !== null)
          .map((p) => p.prodCatName),
      ),
    );
  }, [productList]);
  const filteredProductList = useMemo(() => {
    if (categoryFilter === "all") return productList;

    return productList.filter(
      (product) => product.prodCatName === categoryFilter,
    );
  }, [productList, categoryFilter]);
  const removeProduct = (product: OrderList) => {
    const newSelectedOrder = selectedOrder?.filter(
      (prod) => prod.prodVarId !== product.prodVarId,
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
    const totalAmount = getTotalAmount(); // total to pay
    let remaining = totalAmount;
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
    const paymentMethodData: CreateSalePaymentDto[] = paymentMethod
      ?.map((pm) => {
        if (remaining <= 0) return null; // nothing left to pay

        // apply either the payment amount or the remaining, whichever is smaller
        const appliedAmount = Math.min(pm.salesPaymentAmount, remaining);

        // reduce remaining
        remaining -= appliedAmount;

        return {
          paymentReference: pm.paymentReference,
          salesId: 0,
          salesPaymentAmount: appliedAmount,
          payMetId: pm.payMetId,
          salesPaymentStatus: "completed",
        };
      })
      .filter(Boolean) as CreateSalePaymentDto[];
    const salesData: CreateSaleDto = {
      customerId: customer?.customerId ? customer?.customerId : 0,
      salesInvoice: "",
      salesCreatedBy: user?.userId ?? 0,
      salesNo: "",
      salesStatus: "completed",
      salesTotalAmount: getTotalAmount(),
      storeId: user?.storeId ?? 0,
      salesSubTotal: subtotal,
      salesTotalPaid: totalPaid ?? 0,
      saleDiscounts: selectedDiscount ?? [],
      salesItems: saleItems,
      salesPayments: paymentMethodData,
    };

    try {
      console.log({ salesData });
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
      toast.success(res.message);
      mutateProducts();
      setProductList((prev) =>
        prev.map((product) => ({
          ...product,
          productVariants: product.productVariants?.map((variant) => {
            const soldItem = selectedOrder?.find(
              (o) => o.prodVarId === variant.prodVarId,
            );
            return soldItem
              ? { ...variant, sold: (variant.sold ?? 0) + soldItem.quantity }
              : variant;
          }),
        })),
      );
      setIsPaymentSuccess(true);
      setPaymentMethod([]);
      setSelectedOrder([]);
      setSelectedDiscount([]);
      handleClearCustomerComponent();
      return false;
    } catch (e) {
      console.log(e);
      toast.error("Failed to add Inventory.");
      return false;
    }
  };

  const searchCustomers = async (query: string): Promise<Customer[]> => {
    const res = await fetch(
      `/api/customers/store/${storeId}?search=${encodeURIComponent(query)}`,
    );
    const json = await res.json();
    return json.data || [];
  };
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
  const handleViewToggle = () => {
    const newView =
      showProductView === "product" ? "product-variant" : "product";
    setShowProductView(newView);
  };
  const addDiscount = (newDisc: Discounts) => {
    setSelectedDiscount((prev) => {
      const existing = prev?.some((d) => d.discountId === newDisc.discountId);
      if (existing) {
        return prev;
      }
      console.log({ newDisc });
      const discount =
        newDisc.discountType === "fixed"
          ? newDisc.discountValue
          : subtotal * (Number(newDisc.discountValue) / 100);
      console.log({ discount });
      return [
        ...(prev ?? []),
        {
          discountId: newDisc.discountId,
          salesDiscountId: 0,
          saleId: 0,
          discountAmount:
            newDisc.discountType === "fixed"
              ? Number(newDisc.discountValue)
              : Math.max(0, subtotal * (Number(newDisc.discountValue) / 100)),
          salesDiscStatus: "applied",
        },
      ];
    });
  };
  const getDiscountMeta = (discountId: number) =>
    discountResponse.data.find((d) => d.discountId === discountId);
  const removeDiscount = (newDisc: Discounts) => {
    const filter = selectedDiscount?.filter(
      (disc) => disc.discountId !== newDisc.discountId,
    );
    setSelectedDiscount(filter ?? []);
  };

  return (
    <PageLayout>
      <div className="flex flex-1 overflow-visible h-full">
        {/* Left section */}
        <div className="flex flex-col flex-[0.75] h-full">
          <div className="bg-white min-h-20 border border-gray-200 flex justify-between items-center px-4 py-2 overflow-visible">
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
                    icon={ArrowLeft}
                    onClick={() => setSelectedProduct(null)}
                  />
                </div>
              </>
            ) : (
              <>
                {/* Main Header */}
                <div className="flex items-center">
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2 items-center">
                      {showProductView === "product" ? (
                        <div className="">
                          <Button
                            label=""
                            icon={
                              showProductView === "product" ? Layers2 : Package
                            }
                            color="outline"
                            size="sm"
                            onClick={handleViewToggle}
                            aria-label={`Switch to ${showProductView === "product" ? "variant" : "product"} view`}
                          />
                        </div>
                      ) : (
                        <div className="">
                          <Button
                            label=""
                            icon={Package}
                            color="outline"
                            size="sm"
                            onClick={() => {
                              setShowProductView("product");
                            }}
                          />
                        </div>
                      )}
                      <h1 className="text-sm 2xl:text-lg font-semibold text-gray-900 mr-5">
                        Products
                      </h1>
                    </div>

                    <div className="flex gap-2">
                      <SearchBar url={""} />
                      <div>
                        {" "}
                        <Button
                          size="xs"
                          label="All"
                          color={
                            categoryFilter === "all" ? "primary" : "outline"
                          }
                          onClick={() => {
                            setCategoryFilter("all");
                          }}
                        />
                      </div>
                      {productCategoriesList.map((pc, index) => (
                        <div key={index}>
                          {" "}
                          <Button
                            size="xs"
                            label={pc}
                            color={
                              categoryFilter === pc ? "primary" : "outline"
                            }
                            onClick={() => {
                              setCategoryFilter(pc);
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 items-end justify-start h-full">
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
                </div>
              </>
            )}
          </div>
          {showProductView === "product" ? (
            selectedProduct ? (
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
                data={filteredProductList ?? []}
                selectProduct={(data) => {
                  setSelectedProduct(data);
                }}
                addProductOrder={addProductOrder}
              />
            )
          ) : (
            filteredProductList.map((p) => (
              <ProductVariant
                key={p.prodId}
                data={p}
                onClick={function (data: ProductVariants): void {
                  console.log({ data });
                }}
                onBack={() => {
                  setSelectedProduct(null);
                }}
                addProductOrder={addProductOrder}
                addQuantity={addQuantity}
              />
            ))
          )}
        </div>

        <div className="flex-[0.25] flex flex-col justify-between bg-white h-full border border-gray-200">
          <div className="flex-[0.05] border-b p-2 border-gray-200 flex justify-between items-center">
            <h1 className="font-semibold text-xs 2xl:text-md">Order Details</h1>
            <span className="text-[9px] 2xl:text-sm font-semibold">
              {selectedOrder?.length} items
            </span>
          </div>
          <div className="flex-[0.05] border-b p-2 border-gray-200 flex  items-center gap-5">
            <h1 className="font-semibold text-[9px] 2xl:text-sm">Customer:</h1>
            <div className="flex-1">
              <DropdownSearch<Customer>
                sizes="xs"
                placeholder="Search customer"
                searchFn={searchCustomers}
                onSelect={function (row: Customer): void {
                  if (row) {
                    setCustomer(row);
                  } else {
                    setCustomer(null);
                  }
                }}
                renderItem={(customer: Customer) => (
                  <span>{customer.customerName}</span>
                )}
                displayValue={(customer: Customer) => customer.customerName}
                clearSignal={clearSignal}
              />
            </div>
          </div>

          <div className="flex-1 p-2 overflow-auto">
            <OrderDetails
              data={selectedOrder}
              removeQuantityProductList={removeQuantityProductList}
              addQuantity={addQuantity}
              removeProduct={removeProduct}
            />
          </div>
          <div className="flex-[0.25] p-5 border-gray-200 flex flex-col gap-1 2xl:gap-4">
            <div className="flex items-center gap-3 pb-2 border-b-2 border-gray-200 justify-between">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 2xl:w-7 2xl:h-7 rounded-lg bg-gradient-to-br from-primary-1/80 to-primary-1/70 flex items-center justify-center shadow-md">
                  <Receipt className="w-2 h-2 2xl:w-4 2xl:h-4 text-white" />
                </div>
                <h1 className="font-semibold text-xs 2xl:text-md  text-gray-800">
                  Payment Details
                </h1>
              </div>
              <div>
                <Button
                  icon={Tag}
                  size="xs"
                  label="Discount"
                  onClick={() => {
                    setShowDiscountModal(true);
                  }}
                  color="secondary"
                />
              </div>
            </div>

            <div className="flex justify-between text-gray-500 text-sm">
              <span className="text-[10px] 2xl:text-md">Subtotal</span>
              <span className="text-[10px] 2xl:text-md">
                {formatPeso(subtotal)}
              </span>
            </div>

            {/* Discounts */}
            {selectedDiscount && selectedDiscount.length > 0 && (
              <>
                {selectedDiscount.map((disc, index) => {
                  const discount = getDiscountMeta(disc.discountId);
                  return (
                    <div
                      key={index}
                      className="flex justify-between text-gray-500 text-sm"
                    >
                      <span>
                        {discount?.discountName} (
                        {discount?.discountType === "percent"
                          ? `${discount?.discountValue}%`
                          : `₱${discount?.discountValue}`}
                        )
                      </span>
                      <span>- {formatPeso(disc.discountAmount)}</span>
                    </div>
                  );
                })}
              </>
            )}

            {/* Total */}
            <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
              <span className=" font-semibold text-[10px] 2xl:text-sm">
                Total
              </span>
              <span className="font-semibold text-[10px] 2xl:text-sm">
                {formatPeso(getTotalAmount())}
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
      {isShowIcons !== null && (
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
      )}
      {showDiscountModal && (
        <Modal
          className="h-[50%]"
          leadingIcon={Tag}
          title="Apply Discount"
          isOpen={showDiscountModal}
          onClose={function (): void {
            setShowDiscountModal(false);
          }}
        >
          <ViewAppliedDiscountModal
            discountData={discountResponse.data ?? []}
            addDiscount={addDiscount}
            selectedDiscounts={selectedDiscount}
            removeDiscount={removeDiscount}
          />
        </Modal>
      )}
      {isCheckOut && (
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
          title={!isPaymentSuccess ? "Confirm Order" : ""}
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
                {/* <span className=" text-xs 2xl:text-lg font-semibold">
                  {" "}
                  Confirm Order
                </span> */}
                <span className="font-semibold  text-[9px] 2xl:text-lg py-2 px-1.5 border border-gray-300 rounded-lg">
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
      )}
    </PageLayout>
  );
};

export default PosPage;
