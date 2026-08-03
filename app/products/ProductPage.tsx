"use client";

import React, { useEffect, useState } from "react";

import PageLayout from "@/components/shared/PageLayout";

import { useSession } from "@/hooks/useSession";

import LoaderComponent from "@/components/shared/LoaderComponent";
import ProductStorePage from "./ProductStorePage";

const ProductPage = () => {
  const { user, hasStore, loading } = useSession();
  const [storeId, setStoreId] = useState<number | null>(null);

  useEffect(() => {
    if (hasStore || user?.storeId || user?.storeId) {
      setStoreId(user?.storeId ?? 0);
    }
  }, [user]);

  if (loading) {
    return (
      <PageLayout className="gap-4 p-2">
        <LoaderComponent />
      </PageLayout>
    );
  }

  return <ProductStorePage storeId={storeId} user={user} />;
};

export default ProductPage;
