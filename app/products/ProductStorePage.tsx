import PageHeader from "@/components/shared/PageHeader";
import PageLayout from "@/components/shared/PageLayout";
import { CreateProductDtos, DisplayProductsDtos } from "@/dtos/products.dto";
import { UserAuth, useSession } from "@/hooks/useSession";

import { fetcher } from "@/utils/fetcher";
import React, { useState } from "react";
import useSWR from "swr";
import ProductCardDetails from "./components/ProductCardDetails";
import {
  Boxes,
  Layers,
  Package2,
  PhilippinePeso,
  Plus,
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
interface ProductStorePageProps {
  storeId: number | null;
  user?: UserAuth | null;
}

const ProductStorePage = ({ storeId }: ProductStorePageProps) => {
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState<DisplayProductsDtos | null>(
    null
  );
  const [showProductVariantPage, setShowProductVariantPage] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  const { user } = useSession();

  const {
    data: itemResponse = { data: [] },
    mutate,
    isLoading,
  } = useSWR<{
    data: DisplayProductsDtos[];
  }>(storeId ? `/api/products/${storeId}` : null, fetcher);

  const columns: Column<DisplayProductsDtos>[] = [
    { key: "#", name: "#", selector: (_row, index) => index + 1 },
    { key: "prodName", name: "Product Name" },
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
                        variants.prodVarPrice
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
      if (mutate) {
        mutate();
      }
      return true;
    } catch (e) {
      toast.error("Failed to add product.");
      return false;
    } finally {
      setIsAddingProduct(false);
    }
  };
  return (
    <PageLayout className="gap-4 p-2">
      {selectedRow && showProductVariantPage ? (
        <ProductVariantPage
          data={selectedRow}
          onBack={() => {
            setSelectedRow(null);
          }}
          user={user}
        />
      ) : (
        <>
          <PageHeader
            title={"Products"}
            subtitle="Add, edit, and track products"
          />
          <div className="grid grid-cols-4 gap-4">
            <ProductCardDetails
              title={"Total Products"}
              value={20}
              icon={<Package2 className="w-6 h-6 text-primary-1" />}
              iconBg="bg-pink-100"
            />
            <ProductCardDetails
              title={"Total Stock"}
              value={20}
              icon={<Boxes className="w-6 h-6 text-blue-500" />}
              iconBg="bg-blue-100"
            />
            <ProductCardDetails
              title={"Total Sales"}
              value={20}
              icon={<PhilippinePeso className="w-6 h-6 text-green-500" />}
              iconBg="bg-green-100"
            />
            <ProductCardDetails
              title={"Total Customers"}
              value={20}
              icon={<Users className="w-6 h-6 text-yellow-500" />}
              iconBg="bg-yellow-100"
            />
          </div>
          <div className="flex-1 min-h-0  flex flex-col justify-between overflow-hidden">
            <Table
              columns={columns}
              data={itemResponse.data}
              totalCount={20}
              maxHeight="h-full"
              searchUrl="products"
              loading={isLoading}
              onRowSelection={(row) => {
                setSelectedRow(row);
                setShowProductVariantPage(true);
              }}
              // filterConfig={[]}
              renderTopActions={
                <div className="flex gap-2">
                  <div>
                    <Button
                      isRounded={false}
                      className="text-sm"
                      label="Create Category"
                      size="xs"
                      icon={<Layers size={20} />}
                      onClick={() => {
                        setShowAddProductModal(true);
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
                      icon={<Plus size={20} />}
                      onClick={() => {
                        setShowAddProductModal(true);
                      }}
                    />
                  </div>
                </div>
              }
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
        />
      </Modal>
    </PageLayout>
  );
};

export default ProductStorePage;
