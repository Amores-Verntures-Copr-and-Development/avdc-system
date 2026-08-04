import React from "react";
import RequireRole from "@/components/shared/RequireRole";

import Sales from "./Sales";

const page = () => {
  return (
    <RequireRole>
      <Sales />
    </RequireRole>
  );
};

export default page;
