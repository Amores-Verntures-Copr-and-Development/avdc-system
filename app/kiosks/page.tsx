import RequireRole from "@/components/shared/RequireRole";
import React from "react";
import KiosksPage from "./KiosksPage";

const page = () => {
  return (
    <RequireRole>
      <KiosksPage />
    </RequireRole>
  );
};

export default page;
