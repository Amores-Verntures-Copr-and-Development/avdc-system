"use client";

import { DisplayRequestOrderDto } from "@/dtos/request.dto";
import { fetcher } from "@/utils/fetcher";
import React from "react";
import useSWR from "swr";
import ViewRequestModal from "../ViewRequestModal";
import LoaderComponent from "@/components/shared/LoaderComponent";
import { useRouter } from "next/navigation";
import PageLayout from "@/components/shared/PageLayout";
import Button from "@/components/shared/Button";
import { File } from "lucide-react"; // Icon for empty state
import { useSession } from "@/hooks/useSession";

interface RequestNoPageProps {
  requestNo: string;
}

const RequestNoPage = ({ requestNo }: RequestNoPageProps) => {
  const { user } = useSession();
  const router = useRouter();
  const {
    data: itemResponse = { data: [] },
    mutate,
    isLoading,
  } = useSWR<{
    data: DisplayRequestOrderDto[];
  }>(
    requestNo ? `/api/requests/request-orders?search=${requestNo}` : null,
    fetcher,
  );

  const onBack = () => {
    router.push(`/requisitions`);
  };

  // Loading state
  if (isLoading) return <LoaderComponent />;

  // Empty state
  if (itemResponse.data.length === 0)
    return (
      <div className="flex flex-col justify-center items-center flex-1 gap-4 py-16">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <File size={36} className="text-gray-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-700">
          No records found
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          No data found for request{" "}
          <span className="font-medium">{requestNo}</span>.
        </p>
        <div>
          <Button label="Go Back" size="sm" onClick={onBack} />
        </div>
      </div>
    );

  // Data found
  return (
    <PageLayout className="p-4 gap-4">
      <ViewRequestModal
        selectedReq={itemResponse.data[0]}
        mutateRequest={() => mutate()}
        onBack={onBack}
        user={user}
      />
    </PageLayout>
  );
};

export default RequestNoPage;
