"use client";

import PageLayout from "@/components/shared/PageLayout";
import React, { useEffect, useMemo, useRef, useState } from "react";

import Button from "@/components/shared/Button";
import {
  ArrowLeft,
  Barcode,
  CreditCard,
  Files,
  History,
  Layers2,
  Package,
  Receipt,
  Tag,
  TicketPercent,
  UserRoundPlus,
} from "lucide-react";
import IconButton from "@/components/shared/IconButton";
import { DisplayProductsDtos } from "@/dtos/products.dto";
import { UserAuth } from "@/hooks/useSession";

import { fetcher } from "@/utils/fetcher";
import useSWR from "swr";
import ProductContent from "./components/layout/ProductContent";

import ProductVariant from "./components/layout/ProductVariant";
import { ProductCategories, ProductVariants } from "@/types/products";
import OrderDetails from "./components/layout/OrderDetails";
import { formatPeso } from "@/utils/formatPeso";
import Popup from "@/components/shared/Popup";
import DiscountList from "./components/sidebar/DiscountList";
import PaymentMethodList from "./components/sidebar/PaymentMethodList";
import ProductList from "./components/sidebar/ProductList";
import SalesHistory from "./components/sidebar/SalesOrder";
import { Discounts } from "@/types/discount";
import { PaymentMethods } from "@/types/payment-methods";
import {
  CreateSaleDto,
  CreateSaleItemDisc,
  CreateSaleItemDto,
  CreateSalePaymentDto,
  CreateSalesDiscount,
} from "@/dtos/sales.dto";
import Modal from "@/components/shared/Modal";
import ViewAppliedDiscountModal from "./components/ViewAppliedDiscountModal";
import toast from "react-hot-toast";

import CheckOutModal from "./components/CheckOutModal";
import PaymentSuccessModal from "./components/PaymentSuccessModal";
import { Sales, SalesPaymentStatus, SalesStatus } from "@/types/sales";
import { DropdownSearch } from "@/components/shared/DropDownSearch";
import { Customer } from "@/types/customer";
import SearchBar from "@/components/shared/SearchBar";
import ProductVariantCard from "./components/ProductVariantCard";
import ViewEditAmountItemOrder from "./components/ViewEditAmountItemOrder";
import SalesOrder from "./components/sidebar/SalesOrder";
import AddCustomer from "./components/sidebar/AddCustomer";
import BarcodeScanner from "./components/BarcodeScanner";
import { ApiResponse } from "@/types/api";

export interface ComponentsVariant {
  inventoryItemId: number;
  quantityRequired: number;
}

export interface OrderList {
  prodVarId: number;
  prodVarName: string;
  prodVarPrice: number;
  inventoryItemId?: number | null;
  quantity: number;
  prodVarSubtotal?: number;
  prodVarTotal?: number;
  components?: ComponentsVariant[];
  discounts?: CreateSaleItemDisc[];
}

interface PosPageProps {
  storeId: number | null;
  user: UserAuth | null;
}

const PosPage = ({ storeId, user }: PosPageProps) => {
  const [clearSignal, setClearSignal] = useState(0);

  const limit = 100;
  const [productPage, setProductPage] = useState(1);

  const handleClearCustomerComponent = () => {
    setClearSignal((prev) => prev + 1);
    setCustomer(null);
  };
  const [showProductView, setShowProductView] = useState<
    "product" | "product-variant"
  >("product");
  const [editOrderAmount, setEditOrderAmount] = useState<OrderList | null>(
    null,
  );
  const [searchProd, setSearchProd] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | "all" | null>(
    "all",
  );
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isPaymentSuccess, setIsPaymentSuccess] = useState(false);
  const [recentSales, setRecentSales] = useState<Sales | null>(null);
  const [isShowIcons, setIsShowIcons] = useState<
    | "discount"
    | "methods"
    | "product"
    | "history"
    | null
    | "add-customer"
    | "open-scanner"
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
  const { data: prodCat, mutate: mutateProdCat } = useSWR<
    ApiResponse<ProductCategories[]>
  >(storeId ? `/api/products/${storeId}/product-categories/` : null, fetcher);
  const { data: itemResponse = { data: [] }, mutate: mutateProducts } = useSWR<{
    data: DisplayProductsDtos[];
  }>(
    storeId
      ? `/api/products/${storeId}/pos?search=${encodeURIComponent(
          searchProd.trim(),
        )}&category=${
          categoryFilter === "all"
            ? ""
            : encodeURIComponent(categoryFilter ?? "null")
        }&page=${productPage}&limit=${limit}`
      : null,
    fetcher,
  );

  const { data: paymentMethodResponse = { data: [] } } = useSWR<{
    data: PaymentMethods[];
  }>(storeId ? `/api/payment-method/store/${storeId}/` : null, fetcher);
  const { data: discountResponse = { data: [] } } = useSWR<{
    data: Discounts[];
  }>(storeId ? `/api/sales-discount/store/${storeId}/` : null, fetcher);

  useEffect(() => {
    const nextData = itemResponse.data ?? [];

    setProductList((prev) => {
      if (JSON.stringify(prev) === JSON.stringify(nextData)) {
        return prev;
      }

      return nextData;
    });
  }, [itemResponse.data]);

  const subtotal = useMemo(() => {
    return selectedOrder?.reduce((t, o) => t + Number(o.prodVarTotal), 0) ?? 0;
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

  const addProductBarcode = async (barcode: string) => {
    try {
      if (!barcode.trim()) return;
      const res = await fetch(
        `/api/products/${storeId}/pos?barcode=${encodeURIComponent(barcode)}`,
        {
          method: "GET",
          credentials: "include",
        },
      );
      const data: ApiResponse<DisplayProductsDtos[]> = await res.json();
      if (!data.success || !data.data.length) {
        toast.error(`No found item with ${barcode}`, {
          position: "bottom-center",
        });
        return;
      }
      const foundProduct = data.data[0];
      const foundVariant = foundProduct.productVariants?.find(
        (pv) => pv.barcode === barcode,
      );
      if (!foundVariant) {
        toast.error(`No variant found with ${barcode}`, {
          position: "bottom-center",
        });
        return;
      }
      const existingOrder = selectedOrder?.find(
        (s) => s.prodVarId === foundVariant.prodVarId,
      );
      if (existingOrder) {
        toast.success(`Already in order ${existingOrder.prodVarName}`, {
          position: "bottom-center",
        });
        return;
      }
      const orderListData: OrderList = {
        prodVarId: foundVariant.prodVarId,
        prodVarName: foundVariant.prodVarName,
        prodVarPrice: foundVariant.prodVarPrice,
        quantity: 1,
        inventoryItemId: foundVariant.inventoryItemId,
        components: foundVariant.variantComponents,
      };

      addProductOrder(orderListData);

      toast.success(`Found ${orderListData.prodVarName}`, {
        position: "bottom-center",
      });
    } catch (e) {
      toast.error("Failed to fetch barcode product", {
        position: "bottom-center",
      });
    }
  };

  const calculateItemDiscount = (
    price: number,
    quantity: number,
    discounts: CreateSaleItemDisc[] = [],
  ) => {
    const subtotal = price * quantity;
    let discountTotal = 0;

    for (const d of discounts) {
      const discountDef = discountResponse.data.find(
        (dis) => dis.discountId === d.discountId,
      );

      if (!discountDef) continue;

      const value = Number(discountDef.discountValue);

      if (d.discountType === "percent") {
        // Example: 10% of subtotal
        discountTotal += subtotal * (value / 100);
      }

      if (d.discountType === "fixed") {
        // Example: ₱50 off per item
        discountTotal += value * quantity;
      }
    }

    return Math.min(discountTotal, subtotal);
  };
  const addProductOrder = (newProduct: OrderList) => {
    if (!hasSufficientInventory(newProduct.prodVarId)) {
      toast.error("Insufficient inventory");
      return;
    }

    // deduct once, outside setSelectedOrder
    deductVariantComponents(newProduct.prodVarId, 1);

    setSelectedOrder((prev) => {
      const orders = prev ?? [];
      const existing = orders.find((p) => p.prodVarId === newProduct.prodVarId);

      if (!existing) {
        const quantity = 1;
        const subtotal = newProduct.prodVarPrice * quantity;
        const discount = calculateItemDiscount(
          newProduct.prodVarPrice,
          quantity,
          newProduct.discounts,
        );

        return [
          ...orders,
          {
            ...newProduct,
            quantity,
            prodVarSubtotal: subtotal,
            prodVarTotal: subtotal - discount,
            discounts: newProduct.discounts
              ? newProduct.discounts.map((d) => ({
                  ...d,
                  discountAmount: calculateItemDiscount(
                    newProduct.prodVarPrice,
                    1,
                    [d],
                  ),
                }))
              : [],
          },
        ];
      }

      return orders.map((item) => {
        if (item.prodVarId !== newProduct.prodVarId) return item;

        const quantity = item.quantity + 1;
        const subtotal = item.prodVarPrice * quantity;
        const discount = calculateItemDiscount(
          item.prodVarPrice,
          quantity,
          item.discounts,
        );

        return {
          ...item,
          quantity,
          prodVarSubtotal: subtotal,
          prodVarTotal: subtotal - discount,
        };
      });
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
          if (variant.prodVarId !== prodVarId) {
            return variant;
          }

          const hasInventoryItem = Boolean(variant.inventoryItemId);

          return {
            ...variant,

            // deduct direct stocks
            stocks: hasInventoryItem
              ? Math.max(0, Number(variant.stocks || 0) - quantityToAdd)
              : variant.stocks,

            // deduct components
            variantComponents: variant.variantComponents?.map((vc) => {
              if (!Boolean(vc.isDeductVar)) {
                return vc;
              }

              return {
                ...vc,

                left: Math.max(
                  0,
                  Number(vc.left || 0) -
                    Number(vc.quantityRequired || 0) * quantityToAdd,
                ),
              };
            }),
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
          if (variant.prodVarId !== prodVarId) {
            return variant;
          }

          const hasInventoryItem = Boolean(variant.inventoryItemId);

          return {
            ...variant,

            // restore direct stocks
            stocks: hasInventoryItem
              ? Number(variant.stocks || 0) + quantityToRestore
              : variant.stocks,

            // restore components
            variantComponents: variant.variantComponents?.map((vc) => {
              if (!Boolean(vc.isDeductVar)) {
                return vc;
              }

              return {
                ...vc,

                left:
                  Number(vc.left || 0) +
                  Number(vc.quantityRequired || 0) * quantityToRestore,
              };
            }),
          };
        }),
      })),
    );
  };
  const removeQuantityProductList = (product: OrderList) => {
    // Restore inventory first
    restoreVariantComponents(product.prodVarId, 1);
    console.log({ product });
    setSelectedOrder((prev) => {
      if (!prev) return [];

      return prev
        .map((p) => {
          if (p.prodVarId !== product.prodVarId) return p;

          const newQuantity = Math.max((p.quantity || 0) - 1, 0);

          // Recalculate subtotal
          const newSubtotal = p.prodVarPrice * newQuantity;

          // Recalculate total with discounts
          const newDiscount = calculateItemDiscount(
            p.prodVarPrice,
            newQuantity,
            p.discounts,
          );

          return {
            ...p,
            quantity: newQuantity,
            prodVarSubtotal: newSubtotal,
            prodVarTotal: newSubtotal - newDiscount,
          };
        })
        .filter((p) => p.quantity > 0); // remove items with 0 quantity
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
    if (!hasSufficientInventory(product.prodVarId)) {
      toast.error("Insufficient inventory");
      return;
    }

    deductVariantComponents(product.prodVarId, 1);

    setSelectedOrder((prev) => {
      const orders = prev ?? [];

      const existing = orders.find((p) => p.prodVarId === product.prodVarId);

      if (!existing) {
        const quantity = 1;
        const subtotal = product.prodVarPrice * quantity;
        const discount = calculateItemDiscount(
          product.prodVarPrice,
          quantity,
          product.discounts,
        );

        return [
          ...orders,
          {
            ...product,
            quantity,
            prodVarSubtotal: subtotal,
            prodVarTotal: subtotal - discount,
          },
        ];
      }

      return orders.map((item) => {
        if (item.prodVarId !== product.prodVarId) return item;

        const quantity = item.quantity + 1;
        const subtotal = item.prodVarPrice * quantity;
        const discount = calculateItemDiscount(
          item.prodVarPrice,
          quantity,
          item.discounts,
        );

        return {
          ...item,
          quantity,
          prodVarSubtotal: subtotal,
          prodVarTotal: subtotal - discount,
        };
      });
    });
  };

  const removeProduct = (product: OrderList) => {
    const findQuantity = selectedOrder?.find(
      (p) => p.prodVarId === product.prodVarId,
    )?.quantity;
    restoreVariantComponents(product.prodVarId, findQuantity);
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
  const [isConfirmingOrder, setIsConfirmingOrder] = useState(false);
  const handleConfirmOrder = async (remarks?: string) => {
    const totalAmount = getTotalAmount(); // total to pay
    let remaining = totalAmount;

    // const token = getCookie("avdc_accessToken");

    if (!selectedOrder || selectedOrder.length === 0) {
      toast.error("No selected order!");
      return;
    }
    if (!storeId || storeId === 0) {
      toast.error("No store found!");
      return;
    }
    setIsConfirmingOrder(true);
    const saleItems: CreateSaleItemDto[] =
      selectedOrder?.map((items) => ({
        salesItemPrice: items.prodVarPrice,
        salesItemQuantity: items.quantity,
        salesId: 0,
        salesItemSubtotal: Number(items.prodVarSubtotal),
        salesItemTotal: Number(items.prodVarTotal),
        prodVarId: items.prodVarId,
        inventoryItemId: items.inventoryItemId ?? null,
        components:
          items.components?.map((i) => ({
            inventoryItemId: i.inventoryItemId,
            quantityRequired: i.quantityRequired,
          })) ?? [],
        salesItemDiscounts:
          items.discounts?.map((dis) => ({
            discountAmount: dis.discountAmount,
            discountId: dis.discountId,
            salesItemId: 0,
            salesItemDiscCreatedBy: user?.userId ?? 0,
            discountType: dis.discountType,
          })) ?? [],
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
      salesStatus: SalesStatus.COMPLETED,
      salesTotalAmount: getTotalAmount(),
      storeId: user?.storeId ?? 0,
      salesSubTotal: subtotal,
      salesTotalPaid: totalPaid ?? 0,
      saleDiscounts: selectedDiscount ?? [],
      salesItems: saleItems,
      salesPayments: paymentMethodData,
      salesRemarks: remarks ?? "",
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
      return true;
    } catch (e) {
      console.log(e);
      toast.error("Failed to add Inventory.");
      return false;
    } finally {
      setIsConfirmingOrder(false);
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
        salesPaymentStatus: SalesPaymentStatus.COMPLETED,
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

      // const discount =
      //   newDisc.discountType === "fixed"
      //     ? newDisc.discountValue
      //     : subtotal * (Number(newDisc.discountValue) / 100);

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
  const updateOrderList = (updatedOrder: OrderList) => {
    setSelectedOrder((prev) =>
      prev!.map((order) =>
        order.prodVarId === updatedOrder.prodVarId ? updatedOrder : order,
      ),
    );
  };
  return (
    <PageLayout>
      <div className="flex flex-1 overflow-visible min-h-0 h-full">
        {/* Left section */}
        <div className="flex flex-col flex-[0.75]  min-w-0 h-full">
          <div className="bg-white min-h-10 border border-gray-200 flex justify-between items-center px-2 2xl:px-4 py-1 2xl:py-2 overflow-visible">
            {selectedProduct ? (
              <>
                {/* Product Detail Header */}
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-primary-1 to-primary-1/50 rounded-lg shadow-sm">
                    <Package className="text-white w-3 h-3 2xl:w-5 2xl:h-5" />
                  </div>
                  <div>
                    <h1 className="text-sm 2xl:text-lg font-semibold text-gray-900">
                      {selectedProduct.prodName}
                    </h1>
                    <p className="text-[10px] 2xl:text-xs text-gray-500">
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
                <div className="flex items-center flex-1">
                  <div className=" flex gap-2 p-2 flex-1">
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
                      <div>
                        {" "}
                        <SearchBar
                          useUrl={false}
                          onSearch={(value) => {
                            setSearchProd(value);
                          }}
                          placeholder="Search Products"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end justify-start h-full">
                    <div className="flex gap-2">
                      <IconButton
                        onClick={() => {
                          setIsShowIcons("open-scanner");
                        }}
                        label="Open Scanner"
                        bg="black"
                        icon={<Barcode className="w-5 h-5 2xl:w-7 2xl:h-5" />}
                        isRounded={true}
                      />
                      <IconButton
                        onClick={() => {
                          setIsShowIcons("add-customer");
                        }}
                        label="Add Customer"
                        bg="red"
                        icon={
                          <UserRoundPlus className="w-5 h-5 2xl:w-7 2xl:h-5" />
                        }
                        isRounded={true}
                      />
                      <IconButton
                        onClick={() => {
                          setIsShowIcons("methods");
                        }}
                        label="Payment Method List"
                        bg="green"
                        icon={
                          <CreditCard className="w-5 h-5 2xl:w-7 2xl:h-5" />
                        }
                        isRounded={true}
                      />
                      <IconButton
                        onClick={() => {
                          setIsShowIcons("discount");
                          // TODO: Implement product list functionality
                        }}
                        label="Discount List"
                        bg="blue"
                        icon={
                          <TicketPercent className="w-5 h-5 2xl:w-7 2xl:h-5" />
                        }
                        isRounded={true}
                      />
                      {/* <IconButton
                        onClick={() => {
                          setIsShowIcons("product");
                        }}
                        label="Product List"
                        bg="yellow"
                        icon={<Files className="w-5 h-5 2xl:w-7 2xl:h-5" />}
                        isRounded={true}
                      /> */}
                      <IconButton
                        onClick={() => {
                          setIsShowIcons("history");
                        }}
                        label="Todays Order"
                        bg="primary"
                        icon={<History className="w-5 h-5 2xl:w-7 2xl:h-5" />}
                        isRounded={true}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="flex flex-col w-full 2xl:gap-2 p-2 bg-white border border-gray-200">
            <h2 className="text-xs 2xl:text-base font-semibold text-gray-800 px-2">
              Categories
            </h2>

            <div className="flex items-center gap-2">
              {/* Scrollable categories */}
              <div className="flex-1 overflow-x-auto scrollbar-th scrollbar-thumb-gray-200 scrollbar-track-gray-100">
                <div className="flex gap-2 px-2 py-1 min-w-max">
                  <div className="flex-shrink-0">
                    <Button
                      size="sm"
                      label="All"
                      color={categoryFilter === "all" ? "primary" : "outline"}
                      onClick={() => setCategoryFilter("all")}
                    />
                  </div>

                  {prodCat?.data.map((pc, index) => (
                    <div key={index} className="flex-shrink-0">
                      <Button
                        size="sm"
                        label={pc.prodCatName}
                        color={
                          categoryFilter === pc.prodCatName
                            ? "primary"
                            : "outline"
                        }
                        onClick={() => setCategoryFilter(pc.prodCatName)}
                      />
                    </div>
                  ))}

                  <div className="flex-shrink-0">
                    <Button
                      size="sm"
                      label="No category"
                      color={categoryFilter === null ? "primary" : "outline"}
                      onClick={() => setCategoryFilter(null)}
                    />
                  </div>
                </div>
              </div>

              {/* Fixed right-side pagination */}
              <div className="flex items-center gap-2 flex-shrink-0 pr-2">
                <Button
                  size="sm"
                  label="Prev"
                  color="outline"
                  disabled={productPage === 1}
                  onClick={() =>
                    setProductPage((prev) => Math.max(prev - 1, 1))
                  }
                />

                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {productPage}
                </span>

                <Button
                  size="sm"
                  label="Next"
                  color="outline"
                  disabled={(itemResponse.data?.length ?? 0) < limit}
                  onClick={() => setProductPage((prev) => prev + 1)}
                />
              </div>
            </div>
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
                data={productList ?? []}
                selectProduct={(data) => {
                  setSelectedProduct(data);
                }}
                addProductOrder={addProductOrder}
              />
            )
          ) : (
            <div className="flex-1 bg-white border  border-gray-200 grid grid-cols-1 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 p-2 gap-4 no-scroll overflow-y-auto scroll-smooth auto-rows-max items-start">
              {productList.flatMap((p) =>
                p.productVariants?.flatMap((pv) => (
                  <ProductVariantCard
                    key={pv.prodVarId}
                    data={pv}
                    product={p ?? null}
                    onClick={function (data: ProductVariants): void {
                      console.log(data);
                    }}
                    addProductOrder={addProductOrder}
                  />
                )),
              )}
            </div>
          )}
        </div>

        <div className="flex-[.50] lg:flex-[0.30] 2xl:flex-[0.25] flex flex-col justify-between bg-white h-full border border-gray-200">
          <div className="flex-[0.05] border-b p-2 border-gray-200 flex justify-between items-center">
            <h1 className="font-semibold text-xs 2xl:text-sm">Order Details</h1>
            <span className="text-[9px] 2xl:text-sm font-semibold">
              {selectedOrder?.length} items
            </span>
          </div>
          <div className="flex-[0.05] border-b p-2 border-gray-200 flex  items-center gap-5">
            <h1 className="font-semibold text-xs 2xl:text-sm">Customer:</h1>
            <div className="flex-1">
              <DropdownSearch<Customer>
                sizes="sm"
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
          <div className="flex-1 p-2 overflow-auto border-b border-gray-300">
            <OrderDetails
              setEditOrderAmount={setEditOrderAmount}
              data={selectedOrder}
              removeQuantityProductList={removeQuantityProductList}
              addQuantity={addQuantity}
              removeProduct={removeProduct}
            />
          </div>
          <div className="flex-[0.25] p-2 2xl:p-5 border-gray-200 flex flex-col gap-1 2xl:gap-4">
            <div className="flex items-center gap-3 pb-2  border-gray-200 justify-between">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 2xl:w-7 2xl:h-7 rounded-lg bg-gradient-to-br from-primary-1/80 to-primary-1/70 flex items-center justify-center shadow-md">
                  <Receipt className="w-2 h-2 2xl:w-4 2xl:h-4 text-white" />
                </div>
                <h1 className="font-semibold text-[9px] lg:text-sm 2xl:text-md  text-gray-800">
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
              <span className="text-xs 2xl:text-sm">Subtotal</span>
              <span className="text-xs 2xl:text-sm">
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
                      className="flex justify-between text-gray-500 text-xs 2xl:text-sm"
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
            <div className="flex justify-between  pt-2">
              <span className=" font-semibold text-xs 2xl:text-sm">Total</span>
              <span className="font-semibold text-xs 2xl:text-sm">
                {formatPeso(getTotalAmount())}
              </span>
            </div>
          </div>
          {/* Footer / bottom button */}
          <div className="p-2 border-t border-gray-200">
            <Button
              size="md"
              label="Checkout"
              className="w-full"
              onClick={() => {
                const hasNoOrder =
                  !selectedOrder || selectedOrder?.length === 0;

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
          icon={
            isShowIcons === "add-customer"
              ? UserRoundPlus
              : isShowIcons === "discount"
                ? TicketPercent
                : isShowIcons === "methods"
                  ? CreditCard
                  : isShowIcons === "history"
                    ? History
                    : isShowIcons === "product"
                      ? Files
                      : undefined
          }
          title={
            isShowIcons === "discount"
              ? "Discount List"
              : isShowIcons === "methods"
                ? "Payment Method List"
                : isShowIcons === "product"
                  ? "Product List"
                  : isShowIcons === "history"
                    ? "Sales Order"
                    : isShowIcons === "add-customer"
                      ? "Add Customer"
                      : ""
          }
          isOpen={isShowIcons !== null && isShowIcons !== "open-scanner"}
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
            <SalesOrder storeId={storeId} user={user} />
          ) : isShowIcons === "add-customer" ? (
            <AddCustomer
              storeId={storeId}
              user={user}
              onClose={function (): void {
                setIsShowIcons(null);
              }}
            />
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
          // leftTitleContent={
          //   isPaymentSuccess ? (
          //     <div></div>
          //   ) : (
          //     <span className="font-semibold">
          //       Total: {formatPeso(getTotalAmount())}
          //     </span>
          //   )
          // }
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
              isConfirming={isConfirmingOrder}
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
      <Modal
        isOpen={editOrderAmount !== null}
        onClose={function (): void {
          setEditOrderAmount(null);
        }}
        title={`Edit Order Item ${editOrderAmount?.prodVarName}`}
      >
        <ViewEditAmountItemOrder
          updateOrderList={updateOrderList}
          discountData={discountResponse.data}
          data={editOrderAmount}
          onClose={function (): void {
            setEditOrderAmount(null);
          }}
        />
      </Modal>

      <Modal
        isOpen={isShowIcons === "open-scanner"}
        onClose={function (): void {
          setIsShowIcons(null);
        }}
        title="Scan Item"
      >
        <BarcodeScanner
          onScan={function (code: string): void {
            addProductBarcode(code);
          }}
          onClose={() => setIsShowIcons(null)}
        />
      </Modal>
    </PageLayout>
  );
};

export default PosPage;
