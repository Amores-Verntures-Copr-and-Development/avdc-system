import Button from "@/components/shared/Button";
import { ApiResponse } from "@/types/api";
import { LoyverseIntegrationInterface } from "@/types/loyverse-integration";
import { fetcher } from "@/utils/fetcher";
import React, { useState } from "react";
import useSWR from "swr";

interface LoyverseMainPageProps {
  data: LoyverseIntegrationInterface;
  storeId: number;
}

const LoyverseMainPage = ({ data, storeId }: LoyverseMainPageProps) => {
  const [show, setShow] = useState<"inventory" | "customer">("inventory");

  const { data: itemsResponse } = useSWR<ApiResponse<any[]>>(
    `/api/integration/${storeId}/${data.integId}/loyverse/items`,
    fetcher,
  );
  return (
    <div className="flex flex-col gap-2 mt-2 h-full">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold">Choose tab to show</label>
        <div className="flex gap-2">
          <div>
            <Button
              label="Inventory"
              size="sm"
              onClick={() => setShow("inventory")}
              color={show === "inventory" ? "primary" : "neutral"}
            />
          </div>
          <div>
            <Button
              label="Customer"
              size="sm"
              onClick={() => setShow("customer")}
              color={show === "customer" ? "primary" : "neutral"}
            />
          </div>
        </div>
      </div>
      <div className="min-h-0 bg-white flex-1 border border-card rounded-sm shadow"></div>
    </div>
  );
};

export default LoyverseMainPage;
