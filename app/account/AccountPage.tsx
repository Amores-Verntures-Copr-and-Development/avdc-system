import PageHeader from "@/components/shared/PageHeader";
import PageLayout from "@/components/shared/PageLayout";
import React from "react";

const AccountPage = () => {
  return (
    <PageLayout className="p-2">
      <PageHeader title={"Account Page"} subtitle="Manage account" />
    </PageLayout>
  );
};

export default AccountPage;
