"use client";

import PageLayout from "@/components/shared/PageLayout";
import { Column } from "@/components/shared/Table";
import { PurchaseOrders } from "@/types/purchaseOrders";
import { fetcher } from "@/utils/fetcher";

import React, { useState } from "react";
import useSWR from "swr";
import ShowPOModal from "./components/ShowPOModal";
import { formatDateToWords } from "@/utils/formatDateToWords";
import { getPOStatusInfo } from "@/utils/formatPOStatus";
import { useSession } from "@/hooks/useSession";
import POMainPage from "./POMainPage";

const PurchaseOrderPage = () => {
  const [selectedPo, setSelectedPo] = useState<PurchaseOrders | null>(null);
  const { user } = useSession();
  const baseApi =
    user?.userRole === "employee" && user?.empPosition === "purchaser"
      ? `/api/purchase-order/userId/${user?.userId}`
      : `/api/purchase-order/`;
  const { data: inventoryResponse = { data: [] }, mutate: mutateInventory } =
    useSWR<{ data: PurchaseOrders[] }>(user ? baseApi : null, fetcher);
  const handleUpdateData = async () => {
    const updatedData = await mutateInventory();
    // The updatedData should contain the fresh data
    const findSelectedPo = updatedData?.data.find(
      (po) => po.poId === selectedPo?.poId
    );
    if (findSelectedPo) {
      console.log("Selected PO: ", findSelectedPo);
      setSelectedPo(findSelectedPo);
    }
  };
  return (
    <PageLayout className="p-2 gap-2">
      {!selectedPo ? (
        <POMainPage
          data={inventoryResponse.data}
          setSelectedPo={setSelectedPo}
        />
      ) : (
        <ShowPOModal
          data={selectedPo}
          mutate={handleUpdateData}
          onClose={function (): void {
            setSelectedPo(null);
          }}
          user={user}
        />
      )}
    </PageLayout>
  );
};

export default PurchaseOrderPage;
