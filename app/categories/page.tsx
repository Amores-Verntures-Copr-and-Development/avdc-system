import React from "react";
import RequireRole from "@/components/shared/RequireRole";
import CategoryPage from "./CategoryPage";

const page = () => {
  return (
    <RequireRole>
      <CategoryPage />
    </RequireRole>
  );
};

export default page;
