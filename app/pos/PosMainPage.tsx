"use client";

import LoaderComponent from "@/components/shared/LoaderComponent";
import PageHeader from "@/components/shared/PageHeader";
import PageLayout from "@/components/shared/PageLayout";
import { useSession } from "@/hooks/useSession";
import React, { useEffect, useState } from "react";
import PosPage from "./PosPage";

const PosMainPage = () => {
  const { user, hasStore, loading } = useSession();
  const [storeId, setStoreId] = useState<number | null>(null);
  useEffect(() => {
    if (user && hasStore) {
      setStoreId(user?.storeId);
    }
  }, [user]);
  if (loading) return <LoaderComponent />;
  return (
    <PageLayout className="p-2 gap-2">
      {storeId ? (
        <PosPage storeId={storeId} user={user} />
      ) : (
        <PageHeader title={"Select Store for POS"} />
      )}
    </PageLayout>
  );
};

export default PosMainPage;
