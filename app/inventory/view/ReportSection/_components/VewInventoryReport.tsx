import Button from "@/components/shared/Button";
import Table, { Column } from "@/components/shared/Table";
import { ApiResponse } from "@/types/api";
import { CategoryInterface } from "@/types/categories";
import { InventoryReport, InventoryReportItem } from "@/types/inventory";
import { ItemInterface } from "@/types/items";
import { Reports } from "@/types/report";
import { fetcher } from "@/utils/fetcher";
import React from "react";
import useSWR from "swr";

interface DisplayInventoryReport extends InventoryReport {
  items: DisplayInventoryReportItem[];
  reportTitle?: string;
  reportType?: string;
}

interface DisplayInventoryReportItem
  extends InventoryReportItem,
    ItemInterface,
    CategoryInterface {}

interface VewInventoryReportProps {
  report: Reports | undefined;
}

const columns: Column<DisplayInventoryReportItem>[] = [
  { key: "#", name: "#", selector: (_row, index) => index + 1 },
  {
    key: "itemName",
    name: "Item Name",
    selector: (row) => row.itemName,
  },
  {
    key: "categoryName",
    name: "Category",
    selector: (row) => row.categoryName,
  },
  {
    key: "invRepItemTotalIn",
    name: "Total In",
    selector: (row) => row.invRepItemTotalIn,
  },
  {
    key: "invRepItemTotalOut",
    name: "Total Out",
    selector: (row) => row.invRepItemTotalOut,
  },
  {
    key: "invRepCurrentStock",
    name: "Current Stock",
    selector: (row) => row.invRepCurrentStock,
  },
];

const VewInventoryReport = ({ report }: VewInventoryReportProps) => {
  const { data: itemResponse, isLoading: loading } = useSWR<{
    data: DisplayInventoryReport[];
  }>(
    report?.reportId
      ? `/api/report/${report.inventoryId}/${report.reportId}/inventory-report`
      : null,
    fetcher
  );

  const inventoryReportData = itemResponse?.data?.[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading inventory report...</div>
      </div>
    );
  }

  if (!inventoryReportData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">
          No inventory report data found
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header Section - Fixed Height */}
      <div className="flex-shrink-0">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {inventoryReportData.reportTitle || "Inventory Report"}
              </h1>
              <p className="text-gray-600 mt-1">
                Report Period: {formatDate(inventoryReportData.invReportFrom)}{" "}
                to {formatDate(inventoryReportData.invReportTo)}
              </p>
            </div>
            <div className="text-right">
              <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                {inventoryReportData.reportType?.toUpperCase() || "INVENTORY"}
              </div>
              <p className="text-gray-500 text-sm mt-1">
                Total Items: {inventoryReportData.items.length}
              </p>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4 mt-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-700">
                {
                  inventoryReportData.items.filter(
                    (item) => item.invRepCurrentStock > 0
                  ).length
                }
              </div>
              <div className="text-sm text-green-600">In Stock Items</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-700">
                {
                  inventoryReportData.items.filter(
                    (item) => item.invRepCurrentStock === 0
                  ).length
                }
              </div>
              <div className="text-sm text-yellow-600">Out of Stock</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">
                {inventoryReportData.items.reduce(
                  (sum, item) => sum + item.invRepItemTotalIn,
                  0
                )}
              </div>
              <div className="text-sm text-blue-600">Total Received</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-700">
                {inventoryReportData.items.reduce(
                  (sum, item) => sum + item.invRepItemTotalOut,
                  0
                )}
              </div>
              <div className="text-sm text-purple-600">Total Used</div>
            </div>
          </div>
        </div>
      </div>

      {/* Table Section - Scrollable */}
      <div className="flex-1 min-h-0 flex flex-col bg-white rounded-lg shadow-sm border-gray-200 overflow-hidden">
        <div className="flex-shrink-0 p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            Inventory Items
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Detailed view of all items in the inventory report
          </p>
        </div>

        <div className="flex-1 min-h-0">
          <Table
            columns={columns}
            data={inventoryReportData.items}
            maxHeight="h-full"
          />
        </div>
      </div>

      {/* Footer Section - Fixed Height */}
      <div className="flex-shrink-0 flex justify-between text-center py-3 align-middle items-center border-t-1 border-gray-200">
        <p className="text-sm text-gray-500">
          Report generated on {formatDate(report?.reportCreatedAt ?? "")}
        </p>
        <div>
          <Button size="xs" />
        </div>
      </div>
    </div>
  );
};

export default VewInventoryReport;
