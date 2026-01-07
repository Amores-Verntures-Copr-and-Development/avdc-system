"use client";

import PageHeader from "@/components/shared/PageHeader";
import PageLayout from "@/components/shared/PageLayout";
import { useSession } from "@/hooks/useSession";
import React from "react";
import SalesPage from "./SalesPage";
import SalesMainPage from "./SalesMainPage";
import LoaderComponent from "@/components/shared/LoaderComponent";

const Sales = () => {
  const { user, hasStore, loading, isAdmin } = useSession();

  if (loading) return <LoaderComponent />;
  return (
    <SalesPage storeId={user?.storeId ?? 0} user={user} hasStore isAdmin />
  );
};

export default Sales;
