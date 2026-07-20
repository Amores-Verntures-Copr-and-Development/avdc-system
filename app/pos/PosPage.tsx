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
  ShoppingCart,
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
import { useLocalStorage } from "@/hooks/useLocalStorage";

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

  const [mobileView, setMobileView] = useState<"products" | "cart">("products");

  const limit = 100;
  const [productPage, setProductPage] = useState(1);

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
  const [isConfirmingOrder, setIsConfirmingOrder] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [isCheckOut, setIsCheckOut] = useState(false);

  const [selectedProduct, setSelectedProduct] =
    useState<DisplayProductsDtos | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<
    CreateSalePaymentDto[] | null
  >([]);

  const [selectedDiscount, setSelectedDiscount] = useState<
    CreateSalesDiscount[] | null
  >(null);

  const [selectedOrder, setSelectedOrder] = useLocalStorage<OrderList[]>(
    "selectedOrder",
    [],
  );

  const handleClearCustomerComponent = () => {
    setClearSignal((prev) => prev + 1);
    setCustomer(null);
  };

  const { data: prodCat } = useSWR<ApiResponse<ProductCategories[]>>(
    storeId ? `/api/products/${storeId}/product-categories/` : null,
    fetcher,
  );

  const {
    data: itemResponse = { data: [] },
    mutate: mutateProducts,
    error,
  } = useSWR<{
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

  const rawProductList = useMemo(() => {
    return itemResponse.data ?? [];
  }, [itemResponse.data]);

  const productList = useMemo(() => {
    if (selectedOrder.length === 0) return rawProductList;

    return rawProductList.map((product) => ({
      ...product,
      productVariants: product.productVariants?.map((variant) => {
        const order = selectedOrder.find(
          (item) => item.prodVarId === variant.prodVarId,
        );

        if (!order) return variant;

        return {
          ...variant,
          stocks: variant.inventoryItemId
            ? Math.max(0, Number(variant.stocks || 0) - order.quantity)
            : variant.stocks,

          variantComponents: variant.variantComponents?.map((vc) => {
            if (!vc.isDeductVar) return vc;

            return {
              ...vc,
              left: Math.max(
                0,
                Number(vc.left || 0) -
                  Number(vc.quantityRequired || 0) * order.quantity,
              ),
            };
          }),
        };
      }),
    }));
  }, [rawProductList, selectedOrder]);

  const subtotal = useMemo(() => {
    return selectedOrder.reduce((t, o) => t + Number(o.prodVarTotal), 0);
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

    return Math.max(subtotal - totalDiscount, 0);
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

      if (
        variant.inventoryItemId &&
        Number(variant.stocks || 0) < quantityToAdd
      ) {
        return false;
      }

      for (const vc of variant.variantComponents ?? []) {
        if (!vc.isDeductVar) continue;

        const required = vc.quantityRequired * quantityToAdd;

        if ((vc.left ?? 0) < required) {
          return false;
        }
      }
    }

    return true;
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
        discountTotal += subtotal * (value / 100);
      }

      if (d.discountType === "fixed") {
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

    setSelectedOrder((prev) => {
      const existing = prev.find((p) => p.prodVarId === newProduct.prodVarId);

      if (!existing) {
        const quantity = 1;
        const subtotal = newProduct.prodVarPrice * quantity;
        const discount = calculateItemDiscount(
          newProduct.prodVarPrice,
          quantity,
          newProduct.discounts,
        );

        return [
          ...prev,
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

      return prev.map((item) => {
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

  const addQuantity = (product: OrderList) => {
    if (!hasSufficientInventory(product.prodVarId)) {
      toast.error("Insufficient inventory");
      return;
    }

    setSelectedOrder((prev) =>
      prev.map((item) => {
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
      }),
    );
  };

  const removeQuantityProductList = (product: OrderList) => {
    setSelectedOrder((prev) =>
      prev
        .map((p) => {
          if (p.prodVarId !== product.prodVarId) return p;

          const quantity = Math.max(p.quantity - 1, 0);
          const subtotal = p.prodVarPrice * quantity;
          const discount = calculateItemDiscount(
            p.prodVarPrice,
            quantity,
            p.discounts,
          );

          return {
            ...p,
            quantity,
            prodVarSubtotal: subtotal,
            prodVarTotal: subtotal - discount,
          };
        })
        .filter((p) => p.quantity > 0),
    );
  };

  const removeProduct = (product: OrderList) => {
    setSelectedOrder((prev) =>
      prev.filter((prod) => prod.prodVarId !== product.prodVarId),
    );
  };

  const updateOrderList = (updatedOrder: OrderList) => {
    setSelectedOrder((prev) =>
      prev.map((order) =>
        order.prodVarId === updatedOrder.prodVarId ? updatedOrder : order,
      ),
    );
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

  const getDiscountMeta = (discountId: number) =>
    discountResponse.data.find((d) => d.discountId === discountId);

  useEffect(() => {
    setSelectedDiscount(
      (prev) =>
        prev?.map((d) => {
          const disc = getDiscountMeta(d.discountId);

          return {
            ...d,
            discountAmount:
              disc?.discountType === "fixed"
                ? Number(disc.discountValue)
                : Math.max(0, subtotal * (Number(disc?.discountValue) / 100)),
          };
        }) || [],
    );
  }, [subtotal]);

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

      const existingOrder = selectedOrder.find(
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

  const addProductBarcodeRef = useRef(addProductBarcode);
  addProductBarcodeRef.current = addProductBarcode;
  useEffect(() => {
    const scannerModalOpen =
      isShowIcons === "open-scanner" ||
      isCheckOut ||
      editOrderAmount !== null ||
      showDiscountModal;

    if (scannerModalOpen) return;

    const FAST_KEY_THRESHOLD_MS = 40;
    const MIN_BURST_LENGTH_TO_ACTIVATE = 3;
    const MIN_BARCODE_LENGTH = 6;

    let buffer = "";
    let lastKeyTime = 0;
    let burstActive = false;

    const resetBuffer = () => {
      buffer = "";
      burstActive = false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      const gap = now - lastKeyTime;
      lastKeyTime = now;

      if (gap > FAST_KEY_THRESHOLD_MS) {
        resetBuffer();
      }

      if (e.key === "Enter") {
        if (burstActive && buffer.length >= MIN_BARCODE_LENGTH) {
          e.preventDefault();
          addProductBarcodeRef.current(buffer);
        }
        resetBuffer();
        return;
      }

      if (e.key.length !== 1) return;

      buffer += e.key;

      if (buffer.length >= MIN_BURST_LENGTH_TO_ACTIVATE) {
        burstActive = true;
      }

      if (burstActive) {
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);

    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [isShowIcons, isCheckOut, editOrderAmount, showDiscountModal]);

  const handleConfirmOrder = async (remarks?: string) => {
    const totalAmount = getTotalAmount();
    let remaining = totalAmount;
    setIsConfirmingOrder(true);
    if (selectedOrder.length === 0) {
      toast.error("No selected order!");
      return;
    }

    if (!storeId || storeId === 0) {
      toast.error("No store found!");
      return;
    }

    const saleItems: CreateSaleItemDto[] = selectedOrder.map((items) => ({
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
    }));

    const paymentMethodData: CreateSalePaymentDto[] = paymentMethod
      ?.map((pm) => {
        if (remaining <= 0) return null;

        const appliedAmount = Math.min(pm.salesPaymentAmount, remaining);
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
      customerId: customer?.customerId ? customer.customerId : 0,
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
        throw new Error(res.err);
      }

      const sales = res.data as Sales[];

      setRecentSales(sales[0]);
      toast.success(res.message);

      await mutateProducts();

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
  const cantDiscountAll = selectedOrder.some(
    (i) => i.discounts && i.discounts?.length > 0,
  );
  const removeDiscount = (newDisc: Discounts) => {
    const filter = selectedDiscount?.filter(
      (disc) => disc.discountId !== newDisc.discountId,
    );

    setSelectedDiscount(filter ?? []);
  };

  return (
    <PageLayout>
      <div className="flex flex-col md:flex-row flex-1 overflow-visible min-h-0 h-full">
        <div
          className={`${
            mobileView === "cart" ? "hidden" : "flex"
          } md:flex flex-col flex-1 md:flex-[0.75] min-w-0 h-full min-h-0 pb-16 md:pb-0`}
        >
          <div className="bg-white min-h-10 border border-gray-200 flex flex-wrap justify-between items-center gap-2 px-2 2xl:px-4 py-1 2xl:py-2 overflow-visible">
            {selectedProduct ? (
              <>
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
                <div className="flex flex-col sm:flex-row sm:items-center flex-1 gap-2">
                  <div className="flex flex-wrap gap-2 p-2 flex-1 items-center">
                    <div className="flex gap-2 items-center">
                      {showProductView === "product" ? (
                        <div>
                          <Button
                            label=""
                            icon={
                              showProductView === "product" ? Layers2 : Package
                            }
                            color="outline"
                            size="sm"
                            onClick={handleViewToggle}
                            aria-label={`Switch to ${
                              showProductView === "product"
                                ? "variant"
                                : "product"
                            } view`}
                          />
                        </div>
                      ) : (
                        <div>
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

                      <h1 className="text-sm 2xl:text-lg font-semibold text-gray-900 sm:mr-5">
                        Products
                      </h1>
                    </div>

                    <div className="flex gap-2 flex-1 min-w-[160px]">
                      <div className="w-full">
                        <SearchBar
                          useUrl={false}
                          onSearch={(value) => {
                            setSearchProd(value);
                          }}
                          placeholder="Search Products"
                          captureScanner={false}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 items-end justify-start">
                    <div className="flex gap-2 flex-wrap justify-end">
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
                        }}
                        label="Discount List"
                        bg="blue"
                        icon={
                          <TicketPercent className="w-5 h-5 2xl:w-7 2xl:h-5" />
                        }
                        isRounded={true}
                      />

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

                  {prodCat?.data?.map((pc, index) => (
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
            <div className="flex-1 bg-white border border-gray-200 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 p-2 gap-4 no-scroll overflow-y-auto scroll-smooth auto-rows-max items-start">
              {productList.flatMap((p) =>
                p.productVariants?.flatMap((pv) => {
                  return (
                    <ProductVariantCard
                      key={`${p.prodId}-${pv.prodVarId}`}
                      data={pv}
                      product={p ?? null}
                      onClick={function (data: ProductVariants): void {
                        console.log(data);
                      }}
                      addProductOrder={addProductOrder}
                    />
                  );
                }),
              )}
            </div>
          )}
        </div>

        <div
          className={`${
            mobileView === "products" ? "hidden" : "flex"
          } md:flex flex-1 md:flex-[0.30] 2xl:flex-[0.25] flex-col justify-between bg-white h-full border border-gray-200 min-h-0`}
        >
          <div className="md:hidden border-b border-gray-200 p-2">
            <Button
              label="Back to Products"
              icon={ArrowLeft}
              size="sm"
              color="secondary"
              onClick={() => setMobileView("products")}
            />
          </div>

          <div className="flex-[0.05] border-b p-2 border-gray-200 flex justify-between items-center">
            <h1 className="font-semibold text-xs 2xl:text-sm">Order Details</h1>

            <span className="text-[9px] 2xl:text-sm font-semibold">
              {selectedOrder.length} items
            </span>
          </div>

          <div className="flex-[0.05] border-b p-2 border-gray-200 flex items-center gap-5">
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
              discountLists={discountResponse.data ?? []}
            />
          </div>

          <div className="flex-[0.25] p-2 2xl:p-5 border-gray-200 flex flex-col gap-1 2xl:gap-4">
            <div className="flex items-center gap-3 pb-2 border-gray-200 justify-between">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 2xl:w-7 2xl:h-7 rounded-lg bg-gradient-to-br from-primary-1/80 to-primary-1/70 flex items-center justify-center shadow-md">
                  <Receipt className="w-2 h-2 2xl:w-4 2xl:h-4 text-white" />
                </div>

                <h1 className="font-semibold text-[9px] lg:text-sm 2xl:text-md text-gray-800">
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
                  disabled={cantDiscountAll}
                />
              </div>
            </div>

            <div className="flex justify-between text-gray-500 text-sm">
              <span className="text-xs 2xl:text-sm">Subtotal</span>
              <span className="text-xs 2xl:text-sm">
                {formatPeso(subtotal)}
              </span>
            </div>

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

            <div className="flex justify-between pt-2">
              <span className="font-semibold text-xs 2xl:text-sm">Total</span>
              <span className="font-semibold text-xs 2xl:text-sm">
                {formatPeso(getTotalAmount())}
              </span>
            </div>
          </div>

          <div className="p-2 border-t border-gray-200">
            <Button
              size="md"
              label="Checkout"
              className="w-full"
              onClick={() => {
                if (selectedOrder.length === 0) {
                  toast.error("No order selected!");
                  return;
                }

                setIsCheckOut(true);
              }}
            />
          </div>
        </div>
      </div>

      {mobileView === "products" && (
        <button
          onClick={() => setMobileView("cart")}
          className="md:hidden fixed bottom-3 left-3 right-3 z-30 flex items-center justify-between gap-3 rounded-2xl bg-primary-1 px-4 py-3 text-white shadow-xl transition-transform active:scale-[0.99]"
        >
          <span className="flex items-center gap-2 text-sm font-semibold">
            <ShoppingCart className="w-5 h-5" />
            {selectedOrder.length} item{selectedOrder.length !== 1 ? "s" : ""}
          </span>

          <span className="text-sm font-bold">
            {formatPeso(getTotalAmount())}
          </span>
        </button>
      )}

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
