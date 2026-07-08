"use client";

import LoaderComponent from "@/components/shared/LoaderComponent";
import PageLayout from "@/components/shared/PageLayout";
import { ApiResponse } from "@/types/api";
import { StoreInterface } from "@/types/stores";
import { fetcher } from "@/utils/fetcher";
import { useParams } from "next/navigation";
import React from "react";
import useSWR from "swr";
import LoyversePage from "./_component/LoyversePage";

const Page = () => {
  const params = useParams();
  const { storeName, integId, integrationType } = params;
  console.log({ integId, integrationType });
  const { data, isLoading: storeLoading } = useSWR<
    ApiResponse<StoreInterface[]>
  >(storeName ? `/api/stores/search?storeName=${storeName}` : null, fetcher);

  const store = data?.data[0];

  const isLoadingAll = storeLoading;

  if (isLoadingAll) return <LoaderComponent />;

  if (!store)
    return (
      <PageLayout>
        <div>No store found for this integration</div>
      </PageLayout>
    );
  switch (integrationType) {
    case "loyverse":
      return (
        <LoyversePage integId={Number(integId)} storeId={store?.storeId ?? 0} />
      );

    default:
      return (
        <PageLayout>
          <div>Integration not found</div>
        </PageLayout>
      );
  }
};

export default Page;
