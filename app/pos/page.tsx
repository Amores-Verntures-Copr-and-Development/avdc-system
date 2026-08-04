import React from "react";
import RequireRole from "@/components/shared/RequireRole";
import PosMainPage from "./PosMainPage";

const page = () => {
  return (
    <RequireRole>
      <PosMainPage />
    </RequireRole>
  );
};

export default page;
