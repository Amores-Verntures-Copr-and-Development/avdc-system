import React from "react";
import RequireRole from "@/components/shared/RequireRole";
import CompaniesPage from "./CompaniesPage";

const page = () => {
  return (
    <RequireRole>
      <CompaniesPage />
    </RequireRole>
  );
};

export default page;
