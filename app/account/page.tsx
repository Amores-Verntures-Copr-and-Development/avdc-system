import React from "react";
import RequireRole from "@/components/shared/RequireRole";
import AccountPage from "./AccountPage";

const page = () => {
  return (
    <RequireRole>
      <AccountPage />
    </RequireRole>
  );
};

export default page;
