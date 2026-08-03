"use client";

import LoaderComponent from "@/components/shared/LoaderComponent";
import PageLayout from "@/components/shared/PageLayout";
import { DisplaySalesDto } from "@/dtos/sales.dto";
import { ApiResponse } from "@/types/api";
import { fetcher } from "@/utils/fetcher";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import SelectedSalesPage from "../SelectedSalesPage";

const Page = () => {
  const params = useParams();
  const router = useRouter();
  const salesId = params.salesId as string;

  const {
    data: response,
    mutate,
    isLoading,
  } = useSWR<ApiResponse<DisplaySalesDto>>(
    salesId ? `/api/sales/by-id/${salesId}` : null,
    fetcher,
  );

  if (isLoading) return <LoaderComponent />;

  return (
    <PageLayout className="p-2">
      <SelectedSalesPage
        salesData={response?.data ?? null}
        onBack={() => router.push("/sales")}
        mutateSales={() => mutate()}
      />
    </PageLayout>
  );
};

export default Page;
