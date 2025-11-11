"use client";
import Button from "@/components/shared/Button";
import PageHeader from "@/components/shared/PageHeader";
import {
  AlertTriangle,
  Box,
  FileChartColumn,
  Package,
  Package2,
  ShoppingCart,
  XCircle,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import InventoryCard from "./components/InventoryCard";
import { Column } from "@/components/shared/Table";

import PageLayout from "@/components/shared/PageLayout";

import { DisplayInventoryItems } from "@/dtos/inventory.dto";
import { useSession } from "@/hooks/useSession";

import useSWR from "swr";
import { InventoryInterface } from "@/types/inventory";
import { fetcher } from "@/utils/fetcher";

import { getInventoryStatusInfo } from "@/utils/inventoryStatus";

import InventorySection from "./components/InventorySection/InventorySection";
import StockMovementSection from "./components/StockMovementSection/StockMovementSection";
import ReportSection from "./components/ReportSection/ReportSection";

export interface AddItemToStoreDto {
  storeId: number;
  addedById: number;
  items: DisplayInventoryItems[];
}

export const inventoryItemColumns: Column<DisplayInventoryItems>[] = [
  { name: "ID", key: "inventoryItemId" },
  { name: "Item Name", key: "itemName" },
  {
    name: "Quantity",
    key: "inventoryItemQuantity",
  },
  { name: "Price", key: "itemPrice" },
  { name: "Minimum", key: "inventoryItemMin" },

  { name: "Unit", key: "itemUnit" },
  { name: "Category", key: "categoryName" },
  { name: "Store ID", key: "storeId" },
  {
    name: "Status",
    key: "status",
    selector: (row) => {
      const { status, bgClass, textClass } = getInventoryStatusInfo(
        row.inventoryItemQuantity,
        row.inventoryItemMin
      );

      return (
        <span
          className={`px-2 py-1 rounded-lg font-semibold ${bgClass} ${textClass}`}
        >
          {status}
        </span>
      );
    },
  },
];
export const adminInventoryItemColumns: Column<DisplayInventoryItems>[] = [
  {
    name: "ID",
    key: "inventoryItemId",
    selector: (row) => (
      <span className="text-gray-700 font-medium">{row.inventoryItemId}</span>
    ),
  },
  {
    name: "Item Name",
    key: "itemName",
    selector: (row) => (
      <span className="text-gray-800 font-semibold">{row.itemName}</span>
    ),
  },
  {
    name: "Quantity",
    key: "inventoryItemQuantity",
    selector: (row) => (
      <span
        className={`font-semibold ${
          row.inventoryItemQuantity <= 0
            ? "text-red-600"
            : row.inventoryItemQuantity < row.inventoryItemMin
            ? "text-yellow-600"
            : "text-green-600"
        }`}
      >
        {row.inventoryItemQuantity}
      </span>
    ),
  },
  {
    name: "Price",
    key: "itemPrice",
    selector: (row) => (
      <span className="text-gray-700">
        ₱
        {Number(row.itemPrice || 0).toLocaleString("en-PH", {
          minimumFractionDigits: 2,
        })}
      </span>
    ),
  },
  {
    name: "Minimum",
    key: "inventoryItemMin",
    selector: (row) => (
      <span className="text-gray-600">{row.inventoryItemMin}</span>
    ),
  },
  {
    name: "Unit",
    key: "itemUnit",
    selector: (row) => <span className=" text-gray-600">{row.itemUnit}</span>,
  },
  {
    name: "Category",
    key: "categoryName",
    selector: (row) => (
      <span className="text-gray-700">{row.categoryName || "—"}</span>
    ),
  },
  {
    name: "Status",
    key: "status",
    selector: (row) => {
      const { status, bgClass, textClass } = getInventoryStatusInfo(
        row.inventoryItemQuantity,
        row.inventoryItemMin
      );

      return (
        <span
          className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold ${bgClass} ${textClass}`}
        >
          {status}
        </span>
      );
    },
  },
];

const InventoryPage = () => {
  const [selectionSection, setSelectionSection] = useState<
    "inventory" | "movement" | "report"
  >("inventory");
  const [inventoryId, setInventoryId] = useState(0);
  const { user, hasStore } = useSession();
  const inventoryBaseUrl = hasStore
    ? `/api/inventory/${user?.storeId}`
    : `/api/inventory`;
  const { data: inventoryResponse = { data: [] } } = useSWR<{
    data: InventoryInterface[];
  }>(inventoryBaseUrl, fetcher);

  useEffect(() => {
    if (
      inventoryResponse &&
      Array.isArray(inventoryResponse.data) &&
      inventoryResponse.data.length > 0
    ) {
      setInventoryId(inventoryResponse.data[0].inventoryId);
    }
  }, [inventoryResponse]);
  const { data: inventoryItemResponse = { data: [] } } = useSWR(
    `api/inventory/item/${inventoryId}/details`,
    fetcher
  );
  console.log("inventoryItemResponse: ", inventoryItemResponse);
  const stats = inventoryItemResponse?.data?.[0] || {};
  return (
    <PageLayout className="gap-2 p-4">
      <div className="flex justify-between items-center">
        <PageHeader
          title={"Inventory"}
          subtitle="Track and manage your stock levels"
        />
      </div>

      {/* Cards */}
      <div className="grid grid-cols-4 gap-4">
        <InventoryCard
          title="Total Items"
          value={stats.totalItems || 0}
          icon={<Box className="w-6 h-6 text-blue-500" />}
          iconBg="bg-blue-100"
        />
        <InventoryCard
          title="Good Stock Items"
          value={stats.goodStock || 0}
          icon={<ShoppingCart className="w-6 h-6 text-green-500" />}
          iconBg="bg-green-100"
        />
        <InventoryCard
          title="Low Stock Items"
          value={stats.lowStock || 0}
          icon={<AlertTriangle className="w-6 h-6 text-yellow-500" />}
          iconBg="bg-yellow-100"
        />

        <InventoryCard
          title="Out of stock items"
          value={stats.outStock || 0}
          icon={<XCircle className="w-6 h-6 text-red-500" />}
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
              className="text-xs font-semibold"
              icon={<Package size={16} />}
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
              className="text-xs font-semibold"
              icon={<Package2 size={16} />}
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
              className="text-xs font-semibold"
              icon={<FileChartColumn size={16} />}
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

export default InventoryPage;
