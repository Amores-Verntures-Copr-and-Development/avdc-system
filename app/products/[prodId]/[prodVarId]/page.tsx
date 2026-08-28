"use client";

import AccessDenied from "@/components/shared/AccessDenied";
import Button from "@/components/shared/Button";
import LoaderComponent from "@/components/shared/LoaderComponent";
import Modal from "@/components/shared/Modal";
import PageLayout from "@/components/shared/PageLayout";
import VariantComponentPage from "@/app/products/components/VariantComponentPage";
import AddVariantModal from "@/app/products/components/AddVariantModal";
import {
  CreateProductVariantDto,
  DisplaProductVariantsDtos,
  DisplayProductsDtos,
} from "@/dtos/products.dto";
import { useSession } from "@/hooks/useSession";
import { ApiResponse } from "@/types/api";
import { fetcher } from "@/utils/fetcher";
import { ArrowLeft, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import toast from "react-hot-toast";

const Page = () => {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, hasStore, loading } = useSession();
  const urlStoreId = Number(searchParams.get("storeId")) || null;
  // Supervisors/Staff are locked to their own store: the URL's storeId can't
  // grant access to another store. Admins/company users have no personal store,
  // so the product's store comes from the URL (see goToProduct / variant list).
  const storeId = hasStore ? user?.storeId : (urlStoreId ?? user?.storeId);
  const deniedStore =
    hasStore && urlStoreId !== null && urlStoreId !== user?.storeId;
  const prodId = Number(params.prodId);
  const prodVarId = Number(params.prodVarId);
  const [showAddComponent, setShowAddComponent] = useState(false);
  const [showAddVariant, setShowAddVariant] = useState(false);
  const [isAddingVariant, setIsAddingVariant] = useState(false);

  const canFetch = !!user && !deniedStore && !!storeId;

  const { data: productResponse, isLoading: isProductLoading } = useSWR<
    ApiResponse<DisplayProductsDtos[]>
  >(
    canFetch && prodId ? `/api/products/${storeId}/${prodId}` : null,
    fetcher,
  );

  const {
    data: variantResponse,
    mutate,
    isLoading: isVariantLoading,
  } = useSWR<{ data: DisplaProductVariantsDtos | null }>(
    canFetch && prodVarId
      ? `/api/products/${storeId}/product-variants/${prodId}/${prodVarId}`
      : null,
    fetcher,
  );

  const product = productResponse?.data?.[0] ?? null;
  const variant = variantResponse?.data ?? null;

  // Clicking a single-variant product row skips straight to this page (see
  // goToProduct in ProductStorePage.tsx) instead of the variant list, since
  // there's nothing to disambiguate - but that also means the list's "Add
  // Variant" button is unreachable from here, so this page needs its own.
  const handleAddVariant = async (
    prodVariant: CreateProductVariantDto,
  ): Promise<number | null> => {
    setIsAddingVariant(true);
    const newData: CreateProductVariantDto = {
      ...prodVariant,
      prodId,
      prodVarCreatedBy: user?.userId ?? 0,
    };
    try {
      const response = await fetch(
        `/api/products/${storeId}/product-variants/${prodId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newData),
          credentials: "include",
        },
      );

      const res = await response.json();

      if (!res.success) {
        throw new Error(res.err);
      }
      toast.success(res.message);
      return res.data ?? null;
    } catch (e) {
      console.log(e);
      toast.error("Failed to add variant!");
      return null;
    } finally {
      setIsAddingVariant(false);
    }
  };

  if (loading || isProductLoading || isVariantLoading)
    return <LoaderComponent />;

  if (deniedStore)
    return (
      <AccessDenied
        message="You don't have access to this store. You can only view products from your assigned store."
        onBack={() => router.push("/products")}
        backLabel="Back to Products"
      />
    );

  return (
    <PageLayout className="p-2 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1 text-xs text-gray-500 min-w-0">
          <Link href="/products" className="hover:text-gray-700 flex-shrink-0">
            Products
          </Link>
          <ChevronRight className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{product?.prodName ?? "Product"}</span>
          <ChevronRight className="h-3 w-3 flex-shrink-0" />
          <span className="truncate font-medium text-gray-700">
            {variant?.prodVarName ?? "Variant"}
          </span>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            icon={Plus}
            label="Add Variant"
            className="font-semibold"
            onClick={() => setShowAddVariant(true)}
          />
          <Button
            color="secondary"
            size="sm"
            icon={ArrowLeft}
            label="Back"
            onClick={() => router.back()}
          />
        </div>
      </div>

      <VariantComponentPage
        data={variant}
        prod={product}
        storeId={storeId ?? 0}
        mutate={() => mutate()}
        showAddComponent={showAddComponent}
        setShowAddComponent={setShowAddComponent}
      />

      <Modal
        title={`Add ${product?.prodName ?? ""} variant`}
        isOpen={showAddVariant}
        onClose={() => setShowAddVariant(false)}
      >
        <AddVariantModal
          storeId={storeId ?? 0}
          prodId={prodId}
          onSubmit={handleAddVariant}
          mutate={() => setShowAddVariant(false)}
          isSubmitting={isAddingVariant}
        />
      </Modal>
    </PageLayout>
  );
};

export default Page;
