"use client";

import Button from "@/components/shared/Button";
import LoaderComponent from "@/components/shared/LoaderComponent";
import PageLayout from "@/components/shared/PageLayout";
import VariantComponentPage from "@/app/products/components/VariantComponentPage";
import {
  DisplaProductVariantsDtos,
  DisplayProductsDtos,
} from "@/dtos/products.dto";
import { useSession } from "@/hooks/useSession";
import { ApiResponse } from "@/types/api";
import { fetcher } from "@/utils/fetcher";
import { ArrowLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";

const Page = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useSession();
  const storeId = user?.storeId;
  const prodId = Number(params.prodId);
  const prodVarId = Number(params.prodVarId);
  const [showAddComponent, setShowAddComponent] = useState(false);

  const { data: productResponse, isLoading: isProductLoading } = useSWR<
    ApiResponse<DisplayProductsDtos[]>
  >(storeId && prodId ? `/api/products/${storeId}/${prodId}` : null, fetcher);

  const {
    data: variantResponse,
    mutate,
    isLoading: isVariantLoading,
  } = useSWR<{ data: DisplaProductVariantsDtos | null }>(
    storeId && prodVarId
      ? `/api/products/${storeId}/product-variants/${prodId}/${prodVarId}`
      : null,
    fetcher,
  );

  const product = productResponse?.data?.[0] ?? null;
  const variant = variantResponse?.data ?? null;

  if (isProductLoading || isVariantLoading) return <LoaderComponent />;

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

        <div>
          {" "}
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
        onClose={() => router.back()}
        showAddComponent={showAddComponent}
        setShowAddComponent={setShowAddComponent}
      />
    </PageLayout>
  );
};

export default Page;
