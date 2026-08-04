import React from "react";
import RequireRole from "@/components/shared/RequireRole";
import IsrPage from "./IsrPage";

const page = () => {
  return (
    <RequireRole>
      <IsrPage />
    </RequireRole>
  );
};

export default page;
