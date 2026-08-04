import React from "react";
import RequireRole from "@/components/shared/RequireRole";
import CustomerPage from "./CustomerPage";

const page = () => {
  return (
    <RequireRole>
      <CustomerPage />
    </RequireRole>
  );
};

export default page;
