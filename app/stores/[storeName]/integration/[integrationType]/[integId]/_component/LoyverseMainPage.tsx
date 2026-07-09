import Button from "@/components/shared/Button";
import Table, { Column } from "@/components/shared/Table";
import { ApiResponse } from "@/types/api";
import {
  LoyverseIntegrationInterface,
  LoyverseItem,
} from "@/types/loyverse-integration";
import { fetcher } from "@/utils/fetcher";
import { formatPeso } from "@/utils/formatPeso";
import React, { useState } from "react";
import useSWR from "swr";

interface LoyverseMainPageProps {
  data: LoyverseIntegrationInterface;
  storeId: number;
}

const LoyverseMainPage = ({ data, storeId }: LoyverseMainPageProps) => {
  const [show, setShow] = useState<"inventory" | "customer">("inventory");

  const { data: itemsResponse, isLoading: itemLoading } = useSWR<
    ApiResponse<LoyverseItem[]>
  >(
    show === "inventory"
      ? `/api/integration/${storeId}/${data.integId}/loyverse/items`
      : null,
    fetcher,
  );
  const itemColumns: Column<LoyverseItem>[] = [
    { key: "name", name: "Item Name", selector: (row) => row.item_name },
    { key: "SK | Handle", name: "sku", selector: (row) => row.handle },
    {
      key: "Price",
      name: "price",
      selector: (row) => formatPeso(row.variants[0].stores[0].price),
    },
  ];
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
      <div className="min-h-0 flex-1">
        <Table
          columns={itemColumns}
          data={itemsResponse?.data ?? []}
          loading={itemLoading}
        />
      </div>
    </div>
  );
};

export default LoyverseMainPage;
