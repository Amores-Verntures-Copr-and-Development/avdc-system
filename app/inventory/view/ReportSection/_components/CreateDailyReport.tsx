import { UserAuth } from "@/hooks/useSession";
import React from "react";

interface CreateDailyReportProps {
  inventoryId: number;
  user?: UserAuth | null;
  mutate: () => void;
  onCancel: () => void;
}

const CreateDailyReport = ({}: CreateDailyReportProps) => {
  return <div>CreateDailyReport</div>;
};

export default CreateDailyReport;
