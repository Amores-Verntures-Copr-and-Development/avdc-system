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
}
const InventoryView = ({ inventoryId, user }: InventoryViewProps) => {
  const [selectionSection, setSelectionSection] = useState<
    "inventory" | "movement" | "report"
  >("inventory");

  const { data: inventoryItemResponse = { data: [] } } = useSWR(
    `api/inventory/item/${inventoryId}/details`,
    fetcher
  );
  console.log({ inventoryId });
  const stats = inventoryItemResponse?.data?.[0] || {};
  console.log({ stats });
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
      <div className="flex">
        <div className="flex border-1 border-gray-300">
          <div>
            <Button
              isRounded={false}
              size="sm"
              onClick={function (): void {
                setSelectionSection("inventory");
              }}
              color={selectionSection === "inventory" ? "primary" : "nocolor"}
              label="Inventory"
              icon={<Package className="h-3 w-3 md:w-5 md:h-5" />}
            />
          </div>
          <div>
            <Button
              isRounded={false}
              size="sm"
              onClick={function (): void {
                setSelectionSection("movement");
              }}
              color={selectionSection === "movement" ? "primary" : "nocolor"}
              label="Stock Movement"
              icon={<Package2 className="h-3 w-3 md:w-5 md:h-5" />}
            />
          </div>
          <div>
            <Button
              isRounded={false}
              size="sm"
              onClick={function (): void {
                setSelectionSection("report");
              }}
              color={selectionSection === "report" ? "primary" : "nocolor"}
              label="Report"
              icon={<FileChartColumn className="h-3 w-3 md:w-5 md:h-5" />}
            />
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0  flex flex-col justify-between overflow-hidden">
        {selectionSection === "inventory" && (
          <InventorySection inventoryId={inventoryId} user={user} />
        )}
        {selectionSection === "movement" && (
          <StockMovementSection inventoryId={inventoryId} />
        )}
        {selectionSection === "report" && <ReportSection />}
      </div>
    </PageLayout>
  );
};

export default InventoryView;
