"use client";

import PageHeader from "@/components/shared/PageHeader";
import React, { useEffect, useState } from "react";

import PageLayout from "@/components/shared/PageLayout";

import { useSession } from "@/hooks/useSession";

import LoaderComponent from "@/components/shared/LoaderComponent";
import ProductStorePage from "./ProductStorePage";

const ProductPage = () => {
  const { user, hasStore, loading } = useSession();
  const [storeId, setStoreId] = useState<number | null>(null);
  console.log({ user });

  useEffect(() => {
    if (hasStore || user?.storeId || user?.storeId) {
      setStoreId(user?.storeId ?? 0);
      console.log({ storeId });
    }
  }, [user]);
  if (loading) return <LoaderComponent />;
  return (
    <PageLayout className="gap-4 p-2">
      {/* <PageHeader title={"Products"} subtitle="Add, edit, and track products" /> */}
      {loading ? (
        <LoaderComponent />
      ) : hasStore ? (
        <ProductStorePage storeId={storeId} />
      ) : (
        <>
          {" "}
          <PageHeader
            title={"Products"}
            subtitle="Add, edit, and track products"
          />
        </>
      )}
    </PageLayout>
  );
};

export default ProductPage;
