import React from "react";
import RequireRole from "@/components/shared/RequireRole";
import StorePage from "./StorePage";

const page = () => {
  return (
    <RequireRole>
      <StorePage />
    </RequireRole>
  );
};

export default page;
