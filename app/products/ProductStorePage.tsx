import PageHeader from "@/components/shared/PageHeader";
import PageLayout from "@/components/shared/PageLayout";
import {
  CreateProductCategoryDto,
  CreateProductDtos,
  DisplaProductVariantsDtos,
  DisplayProductsDtos,
} from "@/dtos/products.dto";
import { UserAuth, useSession } from "@/hooks/useSession";

import { fetcher } from "@/utils/fetcher";
import React, { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import ProductCardDetails from "./components/ProductCardDetails";
import {
  ArrowLeftRight,
  Boxes,
  Eye,
  Icon,
  Layers,
  Package2,
  Pencil,
  PhilippinePeso,
  Plus,
  Store,
  Trash,
  Users,
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
import { se } from "date-fns/locale";
import EditProduct from "./components/EditProduct";
import AddProductCategory from "./components/AddProductCategory";
import ViewProductCategory from "./components/ViewProductCategory";
import { ApiResponse } from "@/types/api";
import { ProductCategories, Products } from "@/types/products";
import Popup from "@/components/shared/Popup";
import ProductVariantTable from "./components/ProductVariantTable";
interface ProductStorePageProps {
  storeId: number | null;
  user?: UserAuth | null;
}

const ProductStorePage = ({ storeId, user }: ProductStorePageProps) => {
  const searchParams = useSearchParams();
  const [productView, setProductView] = useState<
    "product" | "product-variants"
  >("product");
  const router = useRouter();
  const { hasStore, isAdmin } = useSession();
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showAddProductCat, setShowAddProductCat] = useState(false);
  const [selectedRow, setSelectedRow] = useState<DisplayProductsDtos | null>(
    null,
  );
  const [showCategory, setShowCategory] = useState(false);
  const [showProductVariantPage, setShowProductVariantPage] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const url = hasStore ? `/api/products/${storeId}` : `/api/products/`;
  const prodVarUrl = hasStore
    ? `/api/products/${storeId}/product-variants/`
    : `/api/products/${storeId}/product-variants/`;

  const prodVarApi = useMemo(() => {
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

    return `${prodVarUrl}?${params.toString()}`;
  }, [storeId, searchParams]);
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
    data: itemResponse = { data: [] },
    mutate,
    isLoading,
  } = useSWR<{
    data: DisplayProductsDtos[];
  }>(user ? apiUrl : null, fetcher);
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
  const {
    data: prodVarResponse = { data: [] },
    mutate: mutateProdVar,
    isLoading: isLoadingProdVar,
  } = useSWR<{
    data: DisplaProductVariantsDtos[];
  }>(productView === "product-variants" ? prodVarApi : null, fetcher);
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
      selector: (row) => {
        const variants = row.productVariants || [];
        // Assuming your row has a suppliers array
        console.log({ variants });
        return (
          <div className="group relative">
            <select
              className="border border-gray-300 rounded px-1 py-0.5 xl:px-2 xl:py-1 w-full text-[10px] xl:text-xs bg-gray-50 appearance-none cursor-default"
              disabled
            >
              <option value="">
                {variants.filter((s) => s !== null).length > 0
                  ? `Variants (${variants.filter((s) => s !== null).length})`
                  : "No Variannts"}
              </option>
            </select>

            {/* Show suppliers on hover */}
            {variants.filter((s) => s !== null).length > 0 && (
              <div className="absolute hidden group-hover:block z-10 top-full left-0 right-0 bg-white border border-gray-300 rounded shadow-lg max-h-32 overflow-y-auto">
                {variants
                  .filter((variants) => variants !== null)
                  .map((variants, index) => (
                    <div
                      key={index}
                      className="px-2 py-1 text-[10px] xl:text-xs hover:bg-gray-100 cursor-default"
                    >
                      {`${variants.prodVarName} (${formatPeso(
                        variants.prodVarPrice,
                      )})`}
                    </div>
                  ))}
              </div>
            )}
          </div>
        );
      },
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
      selector: (row) => {
        const variants = row.productVariants || [];
        // Assuming your row has a suppliers array
        console.log({ variants });
        return (
          <div className="group relative">
            <select
              className="border border-gray-300 rounded px-1 py-0.5 xl:px-2 xl:py-1 w-full text-[10px] xl:text-xs bg-gray-50 appearance-none cursor-default"
              disabled
            >
              <option value="">
                {variants.filter((s) => s !== null).length > 0
                  ? `Variants (${variants.filter((s) => s !== null).length})`
                  : "No Variannts"}
              </option>
            </select>

            {/* Show suppliers on hover */}
            {variants.filter((s) => s !== null).length > 0 && (
              <div className="absolute hidden group-hover:block z-10 top-full left-0 right-0 bg-white border border-gray-300 rounded shadow-lg max-h-32 overflow-y-auto">
                {variants
                  .filter((variants) => variants !== null)
                  .map((variants, index) => (
                    <div
                      key={index}
                      className="px-2 py-1 text-[10px] xl:text-xs hover:bg-gray-100 cursor-default"
                    >
                      {`${variants.prodVarName} (${formatPeso(
                        variants.prodVarPrice,
                      )})`}
                    </div>
                  ))}
              </div>
            )}
          </div>
        );
      },
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
    console.log({ data, storeId });
    setIsAddingProduct(true);
    if (!storeId || storeId === 0) {
      return false;
    }
    const newData: CreateProductDtos = {
      ...data,
      storeId: storeId,
      prodCreatedBy: user?.userId ?? 0,
    };
    console.log({ newData });
    try {
      const data = await fetch(`/api/products/${storeId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newData),
        credentials: "include",
      });

      const res = await data.json();

      if (!res.success) {
        throw new Error(res.err);
      }
      toast.success(res.message);
      mutate();
      return true;
    } catch (e) {
      console.log({ e });
      toast.error("Failed to add product.");
      return false;
    } finally {
      setIsAddingProduct(false);
    }
  };
  const categoryOpions = reponse?.data.map((cat) => ({
    label: cat.prodCatName,
    value: String(cat.prodCatId),
  }));
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
  console.log({ productConfig });
  const handleFilterSave = useCallback(
    (newFilters: Record<string, string[]>) => {
      // setFilters(newFilters);
      // const currentParams = new URLSearchParams(window.location.search);
      // const filterKeys = [...inventoryConfig.map((f) => f.id), "branch"];
      // filterKeys.forEach((key) => currentParams.delete(key));
      // Object.entries(newFilters).forEach(([key, values]) => {
      //   values.forEach((value) => currentParams.append(key, value));
      // });
      // router.push(`?${currentParams.toString()}`);
    },
    [router, productConfig],
  );

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
            <div>
              <div>
                {productView === "product" ? (
                  <Button
                    label="Product Varaiants"
                    size="sm"
                    icon={ArrowLeftRight}
                    hasBorder
                    onClick={() => {
                      setProductView("product-variants");
                    }}
                  />
                ) : (
                  <Button
                    label="Products"
                    size="sm"
                    icon={ArrowLeftRight}
                    hasBorder
                    onClick={() => {
                      setProductView("product");
                    }}
                  />
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <ProductCardDetails
              title={"Total Products"}
              value={20}
              icon={
                <Package2 className="w-3 h-3 2xl:w-6 2xl:h-6 text-primary-1" />
              }
              iconBg="bg-pink-100"
            />
            <ProductCardDetails
              title={"Total Stock"}
              value={20}
              icon={<Boxes className="w-3 h-3 2xl:w-6 2xl:h-6 text-blue-500" />}
              iconBg="bg-blue-100"
            />
            <ProductCardDetails
              title={"Total Sales"}
              value={20}
              icon={
                <PhilippinePeso className="w-3 h-3 2xl:w-6 2xl:h-6 text-green-500" />
              }
              iconBg="bg-green-100"
            />
            <ProductCardDetails
              title={"Total Customers"}
              value={20}
              icon={
                <Users className="w-3 h-3 2xl:w-6 2xl:h-6 text-yellow-500" />
              }
              iconBg="bg-yellow-100"
            />
          </div>
          <div className="flex-1 min-h-0  flex flex-col justify-between overflow-hidden">
            {productView === "product" ? (
              <Table
                showFilter={true}
                filterConfig={productConfig}
                uniqueIdKey="prodId"
                columns={hasStore ? columns : adminColumn}
                data={itemResponse.data}
                totalCount={20}
                maxHeight="h-full"
                searchUrl="products"
                loading={isLoading}
                onSave={handleFilterSave}
                onRowSelection={(row) => {
                  setSelectedRow(row);
                  setShowProductVariantPage(true);
                }}
                // filterConfig={[]}
                showActions
                renderActions={(row) => (
                  <div className="flex justify-center gap-2">
                    <IconButton
                      onClick={function (): void {
                        setSelectedRow(row);
                        setShowProductVariantPage(true);
                      }}
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
                  </div>
                )}
                renderTopActions={
                  <div className="flex gap-2">
                    <div>
                      <Button
                        isRounded={false}
                        className="text-sm"
                        label="View Category"
                        size="xs"
                        icon={Layers}
                        onClick={() => {
                          setShowCategory(true);
                        }}
                        color="outline"
                      />
                    </div>
                    <div>
                      <Button
                        isRounded={false}
                        className="text-sm"
                        label="Add Category"
                        size="xs"
                        icon={Layers}
                        onClick={() => {
                          setShowAddProductCat(true);
                        }}
                        color="neutral"
                      />
                    </div>
                    <div>
                      <Button
                        isRounded={false}
                        className="text-sm"
                        label="Add Product"
                        size="xs"
                        icon={Plus}
                        onClick={() => {
                          setShowAddProductModal(true);
                        }}
                      />
                    </div>
                  </div>
                }
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
              />
            ) : (
              <ProductVariantTable
                data={prodVarResponse.data}
                isLoading={isLoadingProdVar}
                onRowSelection={(row) => {
                  console.log(row);
                }}
              />
            )}
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
        subtitle="Edit products."
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
      >
        <ViewProductCategory
          storeId={storeId ?? 0}
          onClose={() => {
            setShowCategory(false);
          }}
        />
      </Popup>
    </PageLayout>
  );
};

export default ProductStorePage;
