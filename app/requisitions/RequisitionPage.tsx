"use client";
import React from "react";
import StoreRequisitionPage from "./StoreRequisitionPage";
import AdminRequisitionPage from "./AdminRequisitionPage";
import { useSession } from "@/hooks/useSession";

const RequisitionPage = () => {
  const { hasStore } = useSession();

  return <>{hasStore ? <StoreRequisitionPage /> : <AdminRequisitionPage />}</>;
};

export default RequisitionPage;
