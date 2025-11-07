import PageHeader from "@/components/shared/PageHeader";
import React from "react";
import OwnerDashboard from "./Owner/OwnerDashboard";
import PageLayout from "@/components/shared/PageLayout";

const DashboardPage = () => {
  return (
    <PageLayout className="p-2">
      <PageHeader
        title={"Dashboard"}
        subtitle="Welcome back! Here's your system overview."
      />
      <OwnerDashboard />
    </PageLayout>
  );
};

export default DashboardPage;
