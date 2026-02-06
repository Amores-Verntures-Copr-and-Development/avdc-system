import Button from "@/components/shared/Button";
import DateRange from "@/components/shared/DateRange";
import Table, { Column } from "@/components/shared/Table";

import {
  CreateInventoryItemReportDto,
  CreateInventoryReportDto,
  CreateReportDto,
} from "@/dtos/report.dto";
import { UserAuth } from "@/hooks/useSession";
import { fetcher } from "@/utils/fetcher";
import { formatQuantityByUnit } from "@/utils/formatQuantityByUnit";
import React, { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";
import useSWR from "swr";

const columns: Column<DisplayForReportItems>[] = [
  {
    name: "#",
    key: "#",
    selector: (_row, index) => index + 1,
  },
  {
    name: "Name",
    key: "itemName",
  },
  {
    name: "Unit",
    key: "itemUnit",
  },
  {
    name: "Category",
    key: "categoryName",
  },
  {
    name: "Start Stock",
    key: "startingInventory",
    selector: (row) =>
      formatQuantityByUnit(row.startingInventory, row.itemUnit),
  },
  {
    name: "In",
    key: "itemIn",
    selector: (row) => formatQuantityByUnit(row.itemIn, row.itemUnit),
  },
  {
    name: "Out",
    key: "itemOut",
    selector: (row) => formatQuantityByUnit(row.itemOut, row.itemUnit),
  },
  {
    name: "Current Stock",
    key: "currentInventoryQuantity",
    selector: (row) =>
      formatQuantityByUnit(row.currentInventoryQuantity, row.itemUnit),
  },
];

interface CreateInventoryReportProps {
  inventoryId: number;
  user: UserAuth | null;
  onCancel?: () => void;
  onCreate?: (data: DisplayForReportItems[]) => void;
  mutateReport?: () => void;
}

interface DisplayForReportItems {
  inventoryItemId: number;
  inventoryId: number;
  inventoryItemReferenceId: number;
  inventoryItemReferenceType: string;
  currentInventoryQuantity: number;
  itemName: string;
  itemUnit: string;
  categoryName: string;
  itemIn: number;
  itemOut: number;
  startingInventory: number;
}

const CreateInventoryReport = ({
  inventoryId,
  onCancel,

  mutateReport,
  user,
}: CreateInventoryReportProps) => {
  const [range, setRange] = useState<{ from: string; to: string } | undefined>(
    undefined,
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: itemResponse = { data: [] }, isLoading: loading } = useSWR<{
    data: DisplayForReportItems[];
  }>(
    inventoryId && range
      ? `/api/inventory/item/${inventoryId}/for-report?from=${range.from}&to=${range.to}`
      : null,
    fetcher,
  );

  // Calculate totals using useMemo for performance
  const totals = useMemo(() => {
    return itemResponse.data.reduce(
      (acc, item) => ({
        totalItems: acc.totalItems + 1,
        totalStartStock: acc.totalStartStock + Number(item.startingInventory),
        totalCurrentStock:
          acc.totalCurrentStock + Number(item.currentInventoryQuantity),
        totalIn: acc.totalIn + Number(item.itemIn),
        totalOut: acc.totalOut + Number(item.itemOut),
      }),
      {
        totalItems: 0,
        totalStartStock: 0,
        totalCurrentStock: 0,
        totalIn: 0,
        totalOut: 0,
      },
    );
  }, [itemResponse.data]);

  const handleDateRangeChange = useCallback(
    (rangeData: { from: string; to: string }) => {
      setRange(rangeData);
    },
    [],
  );

  const handleCreate = async (data: DisplayForReportItems[]) => {
    setIsGenerating(true);
    const inventoryReportItemData: CreateInventoryItemReportDto[] =
      data.map((item) => ({
        itemId: item.inventoryItemReferenceId,
        invReportId: 0,
        invRepItemTotalIn: item.itemIn,
        invRepItemTotalOut: item.itemOut,
        invRepCurrentStock: item.currentInventoryQuantity,
      })) ?? [];

    const inventoryReportData: CreateInventoryReportDto = {
      reportId: 0,
      invReportFrom: range?.from ?? "",
      invReportTo: range?.to ?? "",
      invetoryReportItem: inventoryReportItemData,
    };

    const reportData: CreateReportDto = {
      inventoryId: inventoryId,
      reportTitle: "",
      reportType: "inventory",
      inventoryReport: inventoryReportData,
      invReportCreatedBy: user?.userId ?? 0,
    };

    try {
      const result = await fetch(`api/report/${inventoryId}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reportData),
      });
      const res = await result.json();
      if (!res.success) {
        throw new Error(res.err);
      }
      toast.success("Inventory report created successfully!");
      if (mutateReport) {
        mutateReport();
      }
      if (onCancel) {
        onCancel();
      }
      return true;
    } catch (e) {
      console.log(e);
      toast.error("Failed to create report.");
      return false;
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex  items-center gap-2">
        <DateRange onDateRangeChange={handleDateRangeChange} />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      )}

      {/* Data Table */}
      {!loading && range && (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <Table
            isRounded={false}
            columns={columns}
            data={itemResponse.data}
            maxHeight="h-full"
          />
        </div>
      )}

      {/* Empty State */}
      {!loading && !range && (
        <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500 bg-gray-50 rounded-lg">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-medium mb-2">No Date Range Selected</h3>
          <p>Please select a date range to view the inventory report</p>
        </div>
      )}

      {/* No Data State */}
      {!loading && range && itemResponse.data.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500 bg-gray-50 rounded-lg">
          <div className="text-4xl mb-4">📭</div>
          <h3 className="text-lg font-medium mb-2">No Data Found</h3>
          <p>No inventory movements found for the selected date range</p>
        </div>
      )}

      {/* Summary Section */}
      {!loading && range && itemResponse.data.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-900">
                {totals.totalItems}
              </div>
              <div className="text-blue-700">Total Items</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-900">
                {totals.totalStartStock}
              </div>
              <div className="text-green-700">Start Stock</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-900">
                {totals.totalCurrentStock}
              </div>
              <div className="text-purple-700">Current Stock</div>
            </div>
            <div className="text-center p-3 bg-emerald-50 rounded-lg">
              <div className="text-2xl font-bold text-emerald-900">
                {totals.totalIn}
              </div>
              <div className="text-emerald-700">Total In</div>
            </div>
            <div className="text-center p-3 bg-rose-50 rounded-lg">
              <div className="text-2xl font-bold text-rose-900">
                {totals.totalOut}
              </div>
              <div className="text-rose-700">Total Out</div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 mt-auto pt-4 border-t border-gray-200">
        <Button
          size="sm"
          label="Cancel"
          color="secondary"
          onClick={onCancel}
          disabled={loading || isGenerating}
        />
        <Button
          size="sm"
          label="Generate Report"
          onClick={() => {
            handleCreate(itemResponse.data);
          }}
          loading={isGenerating}
          disabled={loading || !range || itemResponse.data.length === 0}
        />
      </div>
    </div>
  );
};
export default CreateInventoryReport;
