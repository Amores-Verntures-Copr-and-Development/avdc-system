import PageHeader from "@/components/shared/PageHeader";
import PageLayout from "@/components/shared/PageLayout";
import {
  CreateProductCategoryDto,
  CreateProductDtos,
  DisplayProductsDtos,
} from "@/dtos/products.dto";
import { UserAuth, useSession } from "@/hooks/useSession";

import { fetcher } from "@/utils/fetcher";
import React, { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import StatCard from "@/components/shared/StatCard";
import {
  ArrowLeftRight,
  Barcode,
  Eye,
  FolderKanban,
  Layers,
  Package2,
  PackagePlus,
  PackageSearch,
  Pencil,
  PhilippinePeso,
  Plus,
  ShoppingCart,
  Store,
  Trash,
  Trophy,
} from "lucide-react";
import Button from "@/components/shared/Button";
import Modal from "@/components/shared/Modal";
import AddProductModal from "./components/AddProductModal";
import Table, { Column } from "@/components/shared/Table";
import toast from "react-hot-toast";
import { formatPeso } from "@/utils/formatPeso";
import { formatDateToWords } from "@/utils/formatDateToWords";
import ProductVariantPage from "./ProductVariantPage";
import { useRouter, useSearchParams } from "next/navigation";
import { useStores } from "@/hooks/userStore";
import DynamicDropdown from "@/components/shared/DynamicDropdown";
import IconButton from "@/components/shared/IconButton";

import EditProduct from "./components/EditProduct";
import AddProductCategory from "./components/AddProductCategory";
import ViewProductCategory from "./components/ViewProductCategory";
import { ApiResponse } from "@/types/api";
import { ProductCategories } from "@/types/products";
import Popup from "@/components/shared/Popup";
import ConfirmationModal from "@/components/shared/ConfirmationModal";
import UnlistedItems from "./components/UnlistedItems";
import BarcodeScanner from "../pos/components/BarcodeScanner";
interface ProductStorePageProps {
  storeId: number | null;
  user?: UserAuth | null;
}

// A single variant is shown inline (name + price) since there's nothing to
// disambiguate; multiple variants collapse into a count badge with a hover
// preview instead of listing every price in the row.
const VariantsCell = ({ row }: { row: DisplayProductsDtos }) => {
  const variants = (row.productVariants || []).filter((v) => v !== null);

  if (variants.length === 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-500">
        No variants
      </span>
    );
  }

  if (variants.length === 1) {
    return (
      <div className="flex flex-col">
        <span className="text-xs font-semibold text-gray-800">
          {variants[0].prodVarName}
        </span>
        <span className="text-[11px] text-gray-500">
          {formatPeso(variants[0].prodVarPrice)}
        </span>
      </div>
    );
  }

  return (
    <div className="group relative inline-block">
      <span className="inline-flex cursor-default items-center rounded-full bg-pink-50 px-2 py-1 text-[10px] font-semibold text-primary-1">
        {variants.length} variants
      </span>

      <div className="invisible absolute left-0 top-full z-10 mt-1 w-48 rounded-xl border border-gray-100 bg-white p-1.5 opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100">
        {variants.map((variant) => (
          <div
            key={variant.prodVarId}
            className="flex items-center justify-between gap-2 rounded-lg px-2 py-1 text-[11px] hover:bg-gray-50"
          >
            <span className="truncate text-gray-700">
              {variant.prodVarName}
            </span>
            <span className="shrink-0 font-semibold text-gray-500">
              {formatPeso(variant.prodVarPrice)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProductStorePage = ({ storeId, user }: ProductStorePageProps) => {
  const [showPopupComponent, setShowPopupComponent] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();

  const [showUnlistedItems, setShowUnlistedItems] = useState(false);
  const { hasStore, isAdmin } = useSession();
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showAddProductCat, setShowAddProductCat] = useState(false);
  const [selectedRow, setSelectedRow] = useState<DisplayProductsDtos | null>(
    null,
  );
  const [showBarcode, setShowBarcode] = useState(false);
  const [showCategory, setShowCategory] = useState(false);
  const [showProductVariantPage, setShowProductVariantPage] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  // A single-variant product has nothing to disambiguate, so skip straight
  // to that variant's detail page instead of an intermediate list of one.
  const goToProduct = (row: DisplayProductsDtos) => {
    const variants = (row.productVariants || []).filter((v) => v !== null);
    if (variants.length === 1) {
      router.push(`/products/${row.prodId}/${variants[0].prodVarId}`);
      return;
    }
    setSelectedRow(row);
    setShowProductVariantPage(true);
  };
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const url = hasStore ? `/api/products/${storeId}` : `/api/products/`;
  const [showDeleteConfirmation, setShowDeleteComfirmation] =
    useState<DisplayProductsDtos | null>(null);
  const [filters, setFilters] = useState<Record<string, string[]>>({});

  const apiUrl = useMemo(() => {
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const category = searchParams.get("category") || "";
    const unit = searchParams.get("unit") || "";
    const limit = searchParams.get("limit") || "";
    const page = searchParams.get("page") || "1";
    const store = searchParams.get("store");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (status) params.append("status", status);
    if (category) params.append("category", category);
    if (unit) params.append("unit", unit);
    if (limit) params.append("limit", limit);
    if (store) params.append("store", store);
    if (to) params.append("to", to);
    if (from) params.append("from", from);
    params.append("page", page);

    return `${url}?${params.toString()}`;
  }, [storeId, searchParams]);
  const {
    data: itemResponse,
    mutate,
    isLoading,
  } = useSWR<ApiResponse<DisplayProductsDtos[]>>(user ? apiUrl : null, fetcher);

  // KPI cards (Total Products / Total Sold / Total Sales / Best Seller) are
  // scoped to the whole store's catalog, independent of the table's own
  // search/category/date filters - same pattern as the Sales page's cards.
  const statsUrl = hasStore
    ? `/api/products/${storeId}/details`
    : `/api/products/details`;
  const statsApiUrl = useMemo(() => {
    const store = searchParams.get("store");
    const params = new URLSearchParams();
    if (store) params.append("store", store);
    return `${statsUrl}?${params.toString()}`;
  }, [statsUrl, searchParams]);
  const { data: statsResponse } = useSWR<ApiResponse<any>>(
    user ? statsApiUrl : null,
    fetcher,
  );
  const stats = statsResponse?.data;

  const { stores } = useStores({ user, hasStore, isAdmin });
  const { data: reponse, mutate: mutateCategory } = useSWR<
    ApiResponse<ProductCategories[]>
  >(storeId ? `/api/products/${storeId}/product-categories/` : null, fetcher);
  const storeOptions = Array.isArray(stores)
    ? stores.map((store) => ({
        label: store.storeName, // or whatever you want to show
        value: store.storeName, // optional leading icon if you have one
      }))
    : [];
  const columns: Column<DisplayProductsDtos>[] = [
    { key: "#", name: "#", selector: (_row, index) => index + 1 },
    { key: "prodName", name: "Product Name" },
    { key: "prodCatName", name: "Category" },
    {
      key: "prodCreatedAt",
      name: "Created",
      selector: (row) => formatDateToWords(row.prodCreatedAt),
    },
    {
      name: "Variants",
      key: "productVariants",
      selector: (row) => <VariantsCell row={row} />,
    },
  ];
  const adminColumn: Column<DisplayProductsDtos>[] = [
    { key: "#", name: "#", selector: (_row, index) => index + 1 },
    { key: "prodName", name: "Product Name" },
    { key: "storeName", name: "Store" },
    { key: "prodCatName", name: "Category" },
    {
      key: "prodCreatedAt",
      name: "Created",
      selector: (row) => formatDateToWords(row.prodCreatedAt),
    },
    {
      name: "Variants",
      key: "productVariants",
      selector: (row) => <VariantsCell row={row} />,
    },
  ];
  const handleAddCategory = async (data: CreateProductCategoryDto) => {
    try {
      const result = await fetch(
        `/api/products/${storeId}/product-categories`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify([data]),
          credentials: "include",
        },
      );

      const res = await result.json();

      if (!res.success) {
        throw new Error(res.err);
      }
      toast.success(res.message);
      mutateCategory();
      return true;
    } catch (e: any) {
      console.log({ e });
      toast.error(e.message || "Failed to add category.");
      return false;
    }
  };
  const handleAddProduct = async (data: CreateProductDtos) => {
    setIsAddingProduct(true);

    if (!storeId || storeId === 0) {
      setIsAddingProduct(false);
      return false;
    }

    const newData: CreateProductDtos = {
      ...data,
      storeId,
      prodCreatedBy: user?.userId ?? 0,
    };

    try {
      const response = await fetch(`/api/products/${storeId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newData),
        credentials: "include",
      });

      const res = await response.json();

      if (!response.ok || !res.success) {
        throw new Error(res.message || "Failed to add product.");
      }

      toast.success(res.message);
      mutate();
      return true;
    } catch (e: any) {
      toast.error(e.message || "Failed to add product.");
      return false;
    } finally {
      setIsAddingProduct(false);
    }
  };
  const categoryOpions = [
    {
      label: "No Category",
      value: "null",
    },
    ...(reponse?.data.map((cat) => ({
      label: cat.prodCatName,
      value: String(cat.prodCatId),
    })) ?? []),
  ];
  const { data: reponseCategory } = useSWR<ApiResponse<ProductCategories[]>>(
    storeId ? `/api/products/${storeId}/product-categories/` : null,
    fetcher,
  );
  const productConfig = useMemo(
    () => [
      {
        id: "category",
        label: "Category",
        type: "checkbox" as const,
        options: categoryOpions ?? [],
      },
    ],
    [categoryOpions],
  );

  const handleFilterSave = useCallback(
    (newFilters: Record<string, string[]>) => {
      setFilters(newFilters);
      const currentParams = new URLSearchParams(window.location.search);
      const filterKeys = [...productConfig.map((f) => f.id), "branch"];
      filterKeys.forEach((key) => currentParams.delete(key));
      Object.entries(newFilters).forEach(([key, values]) => {
        values.forEach((value) => currentParams.append(key, value));
      });
      router.push(`?${currentParams.toString()}`);
    },
    [router, productConfig],
  );
  const handleDeleteProduct = async (deleteData: DisplayProductsDtos) => {
    setIsDeleting(true);
    try {
      const res = await fetch(
        `/api/products/${deleteData.storeId}/${deleteData.prodId}/`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      const result = await res.json();
      if (!result.success) {
        throw new Error(result.success);
      }
      mutate();
      toast.success(
        `${showDeleteConfirmation?.prodName} is deleted successfully!`,
      );
      setShowDeleteComfirmation(null);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsDeleting(false);
    }
  };
  return (
    <PageLayout className=" gap-2 2xl:gap-4 p-2">
      {selectedRow && showProductVariantPage ? (
        <ProductVariantPage
          data={selectedRow}
          onBack={() => {
            setSelectedRow(null);
            setShowProductVariantPage(false);
          }}
          user={user}
        />
      ) : (
        <>
          <div className="flex justify-between items-center">
            {" "}
            <PageHeader
              title={"Products"}
              subtitle="Add, edit, and track products"
            />
            <div className="flex gap-2">
              <Button
                label={showBreakdown ? "Hide Breakdowns" : "Show Breakdowns"}
                size="sm"
                icon={Eye}
                onClick={() => setShowBreakdown((prev) => !prev)}
              />
            </div>
          </div>
          {showBreakdown && (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatCard
                icon={Package2}
                title="Total Products"
                value={stats?.totalProducts ?? 0}
                bgColor="bg-pink-100"
                textColor="text-primary-1"
                subtitle="All time products"
                trend={stats?.productsTrend}
                trendColor="#e63389"
                growthPct={stats?.productsGrowthPct}
                growthLabel="new products vs last month"
              />
              <StatCard
                icon={ShoppingCart}
                title="Total Sold"
                value={stats?.totalSold ?? 0}
                bgColor="bg-blue-100"
                textColor="text-blue-500"
                subtitle="Units sold"
                trend={stats?.soldTrend}
                trendColor="#3b82f6"
                growthPct={stats?.soldGrowthPct}
              />
              <StatCard
                icon={PhilippinePeso}
                title="Total Sales"
                value={formatPeso(stats?.totalSales ?? 0)}
                bgColor="bg-green-100"
                textColor="text-green-500"
                subtitle="Product revenue"
                trend={stats?.salesTrend}
                trendColor="#16a34a"
                growthPct={stats?.salesGrowthPct}
              />
              <StatCard
                icon={Trophy}
                title="Best Seller"
                value={stats?.bestSeller?.prodName ?? "No sales yet"}
                bgColor="bg-yellow-100"
                textColor="text-yellow-500"
                subtitle={
                  stats?.bestSeller
                    ? `${stats.bestSeller.totalSold} sold all time`
                    : undefined
                }
                trend={stats?.bestSellerTrend}
                trendColor="#f59e0b"
              />
            </div>
          )}
          <div className="flex-1 min-h-0  flex flex-col justify-between overflow-hidden">
            <Table
              showFilter={true}
              filterConfig={productConfig}
              uniqueIdKey="prodId"
              columns={hasStore ? columns : adminColumn}
              data={itemResponse?.data ?? []}
              showPagination
              totalCount={itemResponse?.count}
              maxHeight="h-full"
              searchUrl="products"
              loading={isLoading}
              onSave={handleFilterSave}
              onRowSelection={(row) => goToProduct(row)}
              // filterConfig={[]}
              showActions
              renderActions={(row) => (
                <div className="flex justify-center gap-2">
                  <IconButton
                    onClick={() => goToProduct(row)}
                    label={"View"}
                    bg={"gray"}
                    icon={<Eye className="w-3 h-3 xl:w-4 xl:h-4" />}
                  />
                  <IconButton
                    onClick={() => {
                      setSelectedRow(row);
                      console.log({ row });
                      setShowEdit(true);
                    }}
                    label={"Edit"}
                    bg={"green"}
                    icon={<Pencil className="w-3 h-3 xl:w-4 xl:h-4" />}
                  />
                  <IconButton
                    onClick={() => {
                      setShowDeleteComfirmation(row);
                    }}
                    label={"Delete"}
                    bg={"red"}
                    icon={<Trash className="w-3 h-3 xl:w-4 xl:h-4" />}
                  />
                </div>
              )}
              renderTopActionButtons={[
                {
                  props: {
                    label: "Scan Barcode",
                    icon: Barcode,
                    onClick: () => {
                      setShowBarcode(true);
                    },
                    size: "sm",
                    className: "font-semibold",
                    color: "success",
                  },
                },
                {
                  props: {
                    label: "View Category",
                    icon: Eye,
                    onClick: () => {
                      setShowCategory(true);
                    },
                    size: "sm",
                    className: "font-semibold",
                    color: "outline",
                  },
                },
                {
                  props: {
                    label: "Add Category",
                    icon: FolderKanban,
                    onClick: () => {
                      setShowAddProductCat(true);
                    },
                    size: "sm",
                    className: "font-semibold",
                    color: "neutral",
                  },
                },
                {
                  props: {
                    label: "Unlisted Items",
                    icon: PackageSearch,
                    onClick: () => {
                      setShowUnlistedItems(true);
                    },
                    size: "sm",
                    className: "font-semibold",
                    color: "tertiary",
                  },
                },
                {
                  props: {
                    label: "Add Product",
                    icon: PackagePlus,
                    onClick: () => {
                      setShowAddProductModal(true);
                    },
                    size: "sm",
                    className: "font-semibold",
                  },
                },
              ]}
              addContentLeftTitle={
                !hasStore && (
                  <div>
                    <DynamicDropdown
                      options={storeOptions}
                      onChange={function (value: string | number): void {
                        if (value) {
                          const url = new URL(window.location.href);
                          url.searchParams.set("store", String(value));
                          router.push(url.toString());
                        } else {
                          const url = new URL(window.location.href);
                          url.searchParams.delete("store"); // remove 'store'
                          router.push(url.toString());
                        }
                      }}
                      placeholder={`Store (${storeOptions.length})`}
                      icon={<Store className="w-4 h-4" />}
                      size="sm"
                    />
                  </div>
                )
              }
              renderMobileCard={(row, index) => {
                const variantCount = (row.productVariants || []).filter(
                  (v) => v !== null,
                ).length;

                return (
                  <div
                    onClick={() => goToProduct(row)}
                    className="flex cursor-pointer flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <span className="rounded-full bg-pink-50 px-2 py-1 text-[11px] font-semibold text-primary-1">
                        #{index + 1}
                      </span>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100">
                        <Package2 className="h-5 w-5 text-gray-300" />
                      </div>
                      <div className="min-w-0">
                        <p className="2xl:truncate text-[11px] 2xl:text-sm font-semibold text-gray-900">
                          {row.prodName}
                        </p>
                        <p className="2xl:truncate text-[10px] 2xl:text-xs text-gray-500">
                          {row.prodCatName || "No Category"}
                          {!hasStore && row.storeName
                            ? ` · ${row.storeName}`
                            : ""}
                        </p>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="rounded-full bg-pink-50 px-2 py-0.5 text-[10px] font-semibold text-primary-1">
                            {variantCount} variant
                            {variantCount !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-2 text-[11px] text-gray-400">
                      Created {formatDateToWords(row.prodCreatedAt)}
                    </div>

                    <div className="flex items-center justify-center gap-2 border-t border-gray-100 pt-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          goToProduct(row);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRow(row);
                          setShowEdit(true);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-green-200 text-green-600 hover:bg-green-50"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteComfirmation(row);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              }}
            />
          </div>
        </>
      )}

      <Modal
        title="Create Product"
        size="lg"
        isOpen={showAddProductModal}
        onClose={function (): void {
          setShowAddProductModal(false);
        }}
      >
        <AddProductModal
          storeId={storeId ?? 0}
          mutate={mutate}
          onSubmit={handleAddProduct}
          isSubmitting={isAddingProduct}
          onCancel={() => {
            setShowAddProductModal(false);
          }}
          categories={reponseCategory?.data ?? []}
        />
      </Modal>
      <Modal
        className="min-h-0"
        title={`${selectedRow?.prodName}`}
        subtitle="Edit products"
        isOpen={showEdit}
        onClose={function (): void {
          setShowEdit(false);
          setSelectedRow(null);
        }}
      >
        <EditProduct
          data={selectedRow}
          onClose={function (): void {
            setShowEdit(false);
            setSelectedRow(null);
          }}
          productCategory={reponse?.data ?? []}
          mutate={mutate}
        />
      </Modal>
      <Modal
        title="Add Category Product"
        isOpen={showAddProductCat}
        onClose={function (): void {
          setShowAddProductCat(false);
        }}
      >
        <AddProductCategory
          onSubmit={handleAddCategory}
          storeId={storeId ?? 0}
          user={user}
          onCancel={function (): void {
            setShowAddProductCat(false);
          }}
        />
      </Modal>
      <Popup
        background="bg-white/50"
        isOpen={showCategory}
        onClose={function (): void {
          setShowCategory(false);
        }}
        title="Product Categories"
        closeOnClickOutside={!showPopupComponent}
      >
        <ViewProductCategory
          storeId={storeId ?? 0}
          setShowPopupComponent={setShowPopupComponent}
          mutateProduct={mutate}
        />
      </Popup>

      <Popup
        background="bg-white/50"
        isOpen={showUnlistedItems}
        onClose={function (): void {
          setShowUnlistedItems(false);
        }}
        title="Unlisted Items"
      >
        <UnlistedItems storeId={storeId!} />
      </Popup>
      <ConfirmationModal
        title={`Delete ${showDeleteConfirmation?.prodName}`}
        onConfirm={() => {
          if (showDeleteConfirmation) {
            handleDeleteProduct(showDeleteConfirmation);
          }
        }}
        confirmationInfo={
          showDeleteConfirmation?.productVariants &&
          showDeleteConfirmation?.productVariants?.length > 0
            ? `Are you sure you want to delete  ${showDeleteConfirmation?.prodName} with ${showDeleteConfirmation.productVariants.length} variants?`
            : `Are you sure you want to delete  ${showDeleteConfirmation?.prodName}?`
        }
        isLoading={isDeleting}
        onClose={function (): void {
          setShowDeleteComfirmation(null);
        }}
        isShow={showDeleteConfirmation !== null}
        confirmLabel="Delete"
      />
      <Modal
        isOpen={showBarcode}
        onClose={function (): void {
          setShowBarcode(false);
        }}
        title="Scan Barcode"
      >
        <BarcodeScanner
          onScan={(code: string) => {
            const params = new URLSearchParams(searchParams.toString());

            params.set("search", code);

            router.push(`/products?${params.toString()}`);
          }}
        />
      </Modal>
    </PageLayout>
  );
};

export default ProductStorePage;
