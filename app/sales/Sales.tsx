"use client";

import PageHeader from "@/components/shared/PageHeader";
import PageLayout from "@/components/shared/PageLayout";
import { useSession } from "@/hooks/useSession";
import React from "react";
import SalesPage from "./SalesPage";
import SalesMainPage from "./SalesMainPage";
import LoaderComponent from "@/components/shared/LoaderComponent";

const Sales = () => {
  const { user, hasStore, loading } = useSession();

  if (loading) return <LoaderComponent />;
  return hasStore ? (
    <SalesPage storeId={user?.storeId ?? 0} user={user} />
  ) : (
    <SalesMainPage />
  );
};

export default Sales;
