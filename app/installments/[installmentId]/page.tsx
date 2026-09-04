import RequireRole from "@/components/shared/RequireRole";
import React from "react";
import InstallmentDetailPage from "./InstallmentDetailPage";

const page = () => {
  return (
    <RequireRole>
      <InstallmentDetailPage />
    </RequireRole>
  );
};

export default page;
