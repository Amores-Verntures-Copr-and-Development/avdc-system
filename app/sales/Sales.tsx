"use client";

import { useSession } from "@/hooks/useSession";
import React from "react";
import SalesPage from "./SalesPage";

import LoaderComponent from "@/components/shared/LoaderComponent";

const Sales = () => {
  const { user, loading } = useSession();

  if (loading) return <LoaderComponent />;
  return (
    <SalesPage storeId={user?.storeId ?? 0} user={user} hasStore isAdmin />
  );
};

export default Sales;
