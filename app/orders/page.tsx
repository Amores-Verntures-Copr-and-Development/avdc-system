import React from "react";
import RequireRole from "@/components/shared/RequireRole";
import OrderPage from "./OrderPage";

const page = () => {
  return (
    <RequireRole>
      <OrderPage />
    </RequireRole>
  );
};

export default page;
