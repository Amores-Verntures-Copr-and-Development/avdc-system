import React from "react";
import RequireRole from "@/components/shared/RequireRole";
import EmployeePage from "./EmployeePage";

const page = () => {
  return (
    <RequireRole>
      <EmployeePage />
    </RequireRole>
  );
};

export default page;
