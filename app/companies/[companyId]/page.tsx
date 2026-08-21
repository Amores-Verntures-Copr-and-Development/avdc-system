import React from "react";
import RequireRole from "@/components/shared/RequireRole";
import CompanyDetailPage from "./CompanyDetailPage";

const page = () => {
  return (
    <RequireRole>
      <CompanyDetailPage />
    </RequireRole>
  );
};

export default page;
