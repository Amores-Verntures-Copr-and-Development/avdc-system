import React from "react";
import RequireRole from "@/components/shared/RequireRole";
import ProductPage from "./ProductPage";

const page = () => {
  return (
    <RequireRole>
      <ProductPage />
    </RequireRole>
  );
};

export default page;
