import LoaderComponent from "@/components/shared/LoaderComponent";
import PageHeader from "@/components/shared/PageHeader";
import PageLayout from "@/components/shared/PageLayout";
import { ApiResponse } from "@/types/api";
import { IntegrationInterface } from "@/types/integrations";
import { LoyverseIntegrationInterface } from "@/types/loyverse-integration";
import { fetcher } from "@/utils/fetcher";
import React from "react";
import useSWR from "swr";
import MerchantPage from "./MerchantPage";
import LoyverseMainPage from "./LoyverseMainPage";

interface LoyversePageProps {
  integId: number;
  storeId: number;
}

const LoyversePage = ({ integId, storeId }: LoyversePageProps) => {
  const {
    data: responseInteg,
    isLoading: isLoadInteg,
    mutate,
  } = useSWR<ApiResponse<LoyverseIntegrationInterface[]>>(
    integId && storeId
      ? `/api/integration/${storeId}/${integId}/loyverse`
      : null,
    fetcher,
  );

  console.log(responseInteg);
  const loyverseInteg = responseInteg?.data[0];
  const hasMerchantId = loyverseInteg?.merchantId;

  if (isLoadInteg) return <LoaderComponent />;
  if (!loyverseInteg)
    return <PageLayout>No Loyverse Integration Found!</PageLayout>;
  return (
    <PageLayout className="p-2">
      <PageHeader
        title="Loyverse Integration"
        subtitle={
          hasMerchantId
            ? "Manage loyverse integration"
            : "Select a loyverse merchant to connect"
        }
      />
      <div className="flex flex-col flex-1">
        {isLoadInteg ? (
          <LoaderComponent />
        ) : hasMerchantId ? (
          <LoyverseMainPage data={loyverseInteg} storeId={storeId} />
        ) : (
          <MerchantPage
            data={loyverseInteg}
            storeId={storeId}
            mutate={mutate}
          />
        )}
      </div>
    </PageLayout>
  );
};

export default LoyversePage;
