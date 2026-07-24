"use client";

import React, { useEffect, useState } from "react";

import PageLayout from "@/components/shared/PageLayout";
import LoaderComponent from "@/components/shared/LoaderComponent";
import { useSession } from "@/hooks/useSession";
import OrderStorePage from "./OrderStorePage";

const OrderPage = () => {
  const { user, hasStore, loading } = useSession();
  const [storeId, setStoreId] = useState<number | null>(null);

  useEffect(() => {
    if (hasStore || user?.storeId) {
      setStoreId(user?.storeId ?? 0);
    }
  }, [user]);

  if (loading) return <LoaderComponent />;

  return (
    <PageLayout className="gap-4 p-2">
      {loading ? (
        <LoaderComponent />
      ) : (
        <OrderStorePage storeId={storeId} user={user} />
      )}
    </PageLayout>
  );
};

export default OrderPage;
