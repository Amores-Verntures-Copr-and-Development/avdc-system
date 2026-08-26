"use client";

import React, { useEffect, useState } from "react";

import PageLayout from "@/components/shared/PageLayout";
import LoaderComponent from "@/components/shared/LoaderComponent";
import { useSession } from "@/hooks/useSession";
import OrderStorePage from "./OrderStorePage";

const OrderPage = () => {
  const { user, hasStore, loading } = useSession();
  const [storeId, setStoreId] = useState<number | null>(null);

  // hasStore means "scoped to a single store" (staff/supervisor) - only
  // those roles get force-pinned to their session store. Everyone else
  // defaults to storeId=null ("All Stores") and can narrow via the
  // dropdown in OrderStorePage.
  useEffect(() => {
    if (hasStore && user?.storeId) {
      setStoreId(user.storeId);
    }
  }, [user, hasStore]);

  if (loading) return <LoaderComponent />;

  return (
    <PageLayout className="gap-4 p-2">
      {loading ? (
        <LoaderComponent />
      ) : (
        <OrderStorePage
          storeId={storeId}
          setStoreId={setStoreId}
          canViewAllStores={!hasStore}
          user={user}
        />
      )}
    </PageLayout>
  );
};

export default OrderPage;
