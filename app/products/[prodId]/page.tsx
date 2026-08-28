"use client";

import AccessDenied from "@/components/shared/AccessDenied";
import LoaderComponent from "@/components/shared/LoaderComponent";
import PageLayout from "@/components/shared/PageLayout";
import ProductVariantPage from "@/app/products/ProductVariantPage";
import { DisplayProductsDtos } from "@/dtos/products.dto";
import { useSession } from "@/hooks/useSession";
import { ApiResponse } from "@/types/api";
import { fetcher } from "@/utils/fetcher";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";

const Page = () => {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, hasStore, loading } = useSession();
  const prodId = Number(params.prodId);
  const urlStoreId = Number(searchParams.get("storeId")) || null;
  // Supervisors/Staff are locked to their own store: the URL's storeId can't
  // grant access to another store. Admins/company users have no personal store,
  // so the product's store comes from the URL (see goToProduct).
  const storeId = hasStore ? user?.storeId : (urlStoreId ?? user?.storeId);
  const deniedStore =
    hasStore && urlStoreId !== null && urlStoreId !== user?.storeId;
  const canFetch = !!user && !deniedStore && !!storeId;

  const { data: productResponse, isLoading } = useSWR<
    ApiResponse<DisplayProductsDtos[]>
  >(canFetch && prodId ? `/api/products/${storeId}/${prodId}` : null, fetcher);

  const product = productResponse?.data?.[0] ?? null;

  if (loading || isLoading) {
    return (
      <PageLayout className="p-2">
        <LoaderComponent />
      </PageLayout>
    );
  }

  if (deniedStore) {
    return (
      <AccessDenied
        message="You don't have access to this store. You can only view products from your assigned store."
        onBack={() => router.push("/products")}
        backLabel="Back to Products"
      />
    );
  }

  return (
    <PageLayout className="p-2 flex flex-col gap-2">
      <ProductVariantPage
        data={product}
        user={user}
        onBack={() => router.back()}
      />
    </PageLayout>
  );
};

export default Page;
