"use client";

import DateRange from "@/components/shared/DateRange";
import DropdownSelect from "@/components/shared/DropdownSelect";
import LoaderComponent from "@/components/shared/LoaderComponent";
import PageLayout from "@/components/shared/PageLayout";
import StatCard from "@/components/shared/StatCard";
import { useSession } from "@/hooks/useSession";
import { ApiResponse } from "@/types/api";
import { StoreInterface } from "@/types/stores";
import { fetcher } from "@/utils/fetcher";
import { formatPeso } from "@/utils/formatPeso";
import { Percent, PhilippinePeso, ShoppingBag, TrendingUp } from "lucide-react";
import React, { useMemo, useState } from "react";
import useSWR from "swr";

interface FinancialSummary {
  totalSales: number;
  totalCost: number;
  grossProfit: number;
  grossMarginPct: number;
}

const FinancialReportsPage = () => {
  const { user, loading: sessionLoading } = useSession();
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: "",
    to: "",
  });
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);

  const { data: storesResponse } = useSWR<ApiResponse<StoreInterface[]>>(
    "/api/stores",
    fetcher,
  );

  const stores = useMemo(
    () =>
      (storesResponse?.data ?? []).filter(
        (s): s is StoreInterface & { storeId: number } => !!s.storeId,
      ),
    [storesResponse],
  );

  // Employees are locked to their own store; company-wide roles (owner/
  // admin/accounting/superadmin/hr) pick a store from the dropdown - default
  // to the first one once the list loads.
  const activeStoreId = user?.storeId ?? selectedStoreId ?? stores[0]?.storeId ?? null;

  const apiUrl = useMemo(() => {
    if (!activeStoreId) return null;

    const params = new URLSearchParams();
    if (dateRange.from) params.append("from", dateRange.from);
    if (dateRange.to) params.append("to", dateRange.to);

    return `/api/financial-reports/${activeStoreId}?${params.toString()}`;
  }, [activeStoreId, dateRange]);

  const { data: response, isLoading } = useSWR<ApiResponse<FinancialSummary>>(
    apiUrl,
    fetcher,
  );

  const summary = response?.data;

  if (sessionLoading) return <LoaderComponent />;

  return (
    <PageLayout className="gap-4 p-2">
      <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-base font-bold text-gray-900 2xl:text-xl">
            Financial Reports
          </h1>
          <p className="text-xs text-gray-400">
            Revenue, cost of goods sold, and gross profit for a store and
            date range
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!user?.storeId && (
            <div className="w-40">
              <DropdownSelect
                name="storeId"
                value={activeStoreId ? String(activeStoreId) : ""}
                onChange={(e) => setSelectedStoreId(Number(e.target.value))}
                options={stores.map((s) => ({
                  value: String(s.storeId),
                  label: s.storeName,
                }))}
                placeholder="Select a store"
                sizes="sm"
              />
            </div>
          )}

          <DateRange onDateRangeChange={setDateRange} />
        </div>
      </div>

      {!activeStoreId ? (
        <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
          Select a store to view its financial report.
        </div>
      ) : isLoading ? (
        <LoaderComponent />
      ) : (
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatCard
            icon={PhilippinePeso}
            title="Total Sales"
            value={formatPeso(summary?.totalSales ?? 0)}
            subtitle="Revenue, net of refunds"
          />

          <StatCard
            icon={ShoppingBag}
            title="Total Cost"
            value={formatPeso(summary?.totalCost ?? 0)}
            subtitle="Cost of goods sold, net of refunds"
            textColor="text-amber-600"
            bgColor="bg-amber-100"
          />

          <StatCard
            icon={TrendingUp}
            title="Gross Profit"
            value={formatPeso(summary?.grossProfit ?? 0)}
            subtitle="Total Sales minus Total Cost"
            textColor="text-emerald-600"
            bgColor="bg-emerald-100"
          />

          <StatCard
            icon={Percent}
            title="Gross Margin"
            value={`${(summary?.grossMarginPct ?? 0).toFixed(1)}%`}
            subtitle="Gross Profit as % of Total Sales"
            textColor="text-indigo-600"
            bgColor="bg-indigo-100"
          />
        </div>
      )}
    </PageLayout>
  );
};

export default FinancialReportsPage;
