import Button from "@/components/shared/Button";

import PageLayout from "@/components/shared/PageLayout";
import { UserAuth } from "@/hooks/useSession";
import { fetcher } from "@/utils/fetcher";
import {
  Box,
  ShoppingCart,
  AlertTriangle,
  XCircle,
  Package,
  Package2,
  FileChartColumn,
} from "lucide-react";
import React, { useState } from "react";
import useSWR from "swr";
import InventoryCard from "../components/InventoryCard";
import InventorySection from "./InventorySection/InventorySection";
import ReportSection from "./ReportSection/ReportSection";
import StockMovementSection from "./StockMovementSection/StockMovementSection";
interface InventoryViewProps {
  inventoryId: number | null;
  user: UserAuth | null;
  view: "inventory" | "movement" | "report";
  inventoryType: "stores" | "stock-room" | "inventoryId";
}
const InventoryView = ({
  inventoryId,
  user,
  view,
  inventoryType,
}: InventoryViewProps) => {
  const { data: inventoryItemResponse = { data: [] } } = useSWR(
    inventoryId ? `api/inventory/item/${inventoryId}/details` : null,
    fetcher
  );

  const stats = inventoryItemResponse?.data?.[0] || {};

  return (
    <PageLayout className="gap-2">
      {/* Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        <InventoryCard
          title="Total Items"
          value={stats.totalItems ?? 0}
          icon={<Box className="h-3 w-3 xl:w-6 xl:h-6 text-blue-500" />}
          iconBg="bg-blue-100"
        />
        <InventoryCard
          title="Good Stock Items"
          value={stats.goodStock ?? 0}
          icon={
            <ShoppingCart className="h-3 w-3 xl:w-6 xl:h-6 text-green-500" />
          }
          iconBg="bg-green-100"
        />
        <InventoryCard
          title="Low Stock Items"
          value={stats.lowStock ?? 0}
          icon={
            <AlertTriangle className="h-3 w-3 xl:w-6 xl:h-6 text-yellow-500" />
          }
          iconBg="bg-yellow-100"
        />

        <InventoryCard
          title="Out of stock items"
          value={stats.outStock ?? 0}
          icon={<XCircle className="h-3 w-3 xl:w-6 xl:h-6 text-red-500" />}
          iconBg="bg-red-100"
        />
      </div>
      <div className="flex-1 min-h-0  flex flex-col justify-between overflow-hidden">
        {view === "inventory" && (
          <InventorySection
            inventoryId={inventoryId}
            user={user}
            inventoryType={inventoryType}
          />
        )}
        {view === "movement" && (
          <StockMovementSection inventoryId={inventoryId} />
        )}
        {view === "report" && (
          <ReportSection inventoryId={inventoryId} user={user} />
        )}
      </div>
    </PageLayout>
  );
};

export default InventoryView;
