import React from "react";
import RequireRole from "@/components/shared/RequireRole";
import InventoryPage from "./InventoryPage";

const page = () => {
  return (
    <RequireRole>
      <InventoryPage />
    </RequireRole>
  );
};

export default page;
