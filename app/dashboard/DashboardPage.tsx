"use client";

import PageHeader from "@/components/shared/PageHeader";
import React from "react";
import OwnerDashboard from "./Owner/OwnerDashboard";
import PageLayout from "@/components/shared/PageLayout";
import PurchaserDashboard from "./Purchaser/PurchaserDashboard";
import { useSession } from "@/hooks/useSession";
import SupervisorPage from "./Supervisor/SupervisorPage";

const DashboardPage = () => {
  const { user, loading, isAuthenticated } = useSession();
  if (loading) {
    return (
      <PageLayout className="p-2">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </PageLayout>
    );
  }
  if (!isAuthenticated) {
    return (
      <PageLayout className="p-2">
        <PageHeader
          title={"Dashboard"}
          subtitle="Please log in to view your dashboard."
        />
        <div className="text-center py-8">
          <p className="text-gray-600">
            You need to be logged in to access this page.
          </p>
        </div>
      </PageLayout>
    );
  }
  return (
    <PageLayout className="p-2 gap-2">
      {/* {isAdmin ? <OwnerDashboard /> : <PurchaserDashboard />} */}
      {user?.userRole === "superadmin" ? (
        <OwnerDashboard />
      ) : user?.userRole == "owner" ? (
        <OwnerDashboard />
      ) : user?.empPosition === "purchaser" ? (
        <PurchaserDashboard />
      ) : user?.empPosition === "supervisor" ? (
        <SupervisorPage />
      ) : (
        <SupervisorPage />
      )}
    </PageLayout>
  );
};

export default DashboardPage;
