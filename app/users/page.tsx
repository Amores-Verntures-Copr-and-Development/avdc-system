import React from "react";
import RequireRole from "@/components/shared/RequireRole";
import UserPage from "./UsersPage";

const page = () => {
  return (
    <RequireRole>
      <UserPage />
    </RequireRole>
  );
};

export default page;
