import React from "react";
import RequireRole from "@/components/shared/RequireRole";
import StockRoomPage from "./StockRoomPage";

const page = () => {
  return (
    <RequireRole>
      <StockRoomPage />
    </RequireRole>
  );
};

export default page;
