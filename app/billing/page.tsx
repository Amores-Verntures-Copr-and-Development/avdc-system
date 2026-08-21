import React from "react";
import RequireRole from "@/components/shared/RequireRole";
import BillingPage from "./BillingPage";

const page = () => {
  return (
    <RequireRole>
      <BillingPage />
    </RequireRole>
  );
};

export default page;
