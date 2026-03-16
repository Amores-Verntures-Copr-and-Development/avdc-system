"use client";
import React, { useState } from "react";
import DashboardCard from "../components/DashboardCard";
import StoreCardSales from "../components/StoreCardSales";
import Chart from "../components/Chart";
import useSWR from "swr";
import { fetcher } from "@/utils/fetcher";
import { Calendar, PhilippinePeso, Store } from "lucide-react";
import { formatPeso } from "@/utils/formatPeso";
import { useRouter } from "next/navigation";
import DynamicDropdown from "@/components/shared/DynamicDropdown";
import { ApiResponse } from "@/types/api";
import StoreRecentSalesCard from "../components/StoreRecentSalesCard";

interface Store {
  id: number;
  name: string;
  sales: number;
  growth: number;
}

interface StoreSales {
  storeId: number;
  storeName: string;
  todaySales: number;
  yesterdaySales: number;
}
interface DailyStoreSalesResponse {
  success: boolean;
  message: string;
  data: StoreSales[];
}
export interface StoreRecentSales {
  storeId: number;
  storeName: string;
  salesNo: number;
  salesTotalAmount: number;
  itemQty: number;
}

const OwnerDashboard = () => {
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [yearPO, setYearPO] = useState(new Date().getFullYear().toString());
  const router = useRouter();
  const { data: dailyStoreSales = { data: [] } } =
    useSWR<DailyStoreSalesResponse>(
      `/api/dashboard/store-daily-sales/`,
      fetcher,
    );
  const { data: dashboardStats = { data: [] } } = useSWR<any>(
    `/api/dashboard/owner`,
    fetcher,
  );
  const { data: salesChart = { data: [] } } = useSWR<any>(
    `/api/dashboard/owner/sales-chart/${year}`,
    fetcher,
  );
  const { data: purchaseOrderChart = { data: [] } } = useSWR<any>(
    `/api/dashboard/owner/sales-chart/${yearPO}/po-chart`,
    fetcher,
  );
  const { data: recentStoreSales = { data: [] } } = useSWR<
    ApiResponse<StoreRecentSales[]>
  >(`/api/dashboard/owner/recent-sales`, fetcher);
  const storeSales: Store[] =
    dailyStoreSales?.data?.map((s) => {
      const today = Number(s.todaySales);
      const yesterday = Number(s.yesterdaySales);

      const growth =
        yesterday === 0 ? 0 : ((today - yesterday) / yesterday) * 100;

      return {
        sales: today,
        id: s.storeId,
        name: s.storeName,
        growth: Number(growth.toFixed(2)), // round to 2 decimals
      };
    }) ?? [];
  const poChartData = purchaseOrderChart?.data ?? [];
  const poData = poChartData.map((item: any) => ({
    name: item.month,
    value: Number(item.totalPurchase),
  }));
  const salesChartData = salesChart?.data ?? []; // take the whole data array
  const salesData = salesChartData.map((item: any) => ({
    name: item.month,
    value: Number(item.totalSales),
  }));

  const totals = dashboardStats?.data[0];
  const totalSales = Number(totals?.totalSales) || 0;
  const totalStores = Number(totals?.totalStores) || 0;
  const totalInventoryCost = Number(totals?.totalInventoryCost) || 0;
  const totalPurchaseOrders = Number(totals?.totalPurchase) || 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full overflow-y-auto p-2">
      {/* Main Content - 3/4 on desktop, full on mobile */}
      <div className="lg:col-span-3  flex flex-1 flex-col gap-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <DashboardCard
            title="Total Sales"
            value={formatPeso(totalSales)}
            icon={PhilippinePeso}
            bgColor="bg-primary-1"
            onClick={() => {
              router.push("/sales");
            }}
          />
          <DashboardCard
            title="Total Stores"
            value={`${totalStores}`}
            icon={Store}
            onClick={() => {
              router.push("/stores");
            }}
          />
          <DashboardCard
            title="Total Inventory Cost"
            value={formatPeso(totalInventoryCost)}
            icon={Calendar}
            bgColor="bg-yellow-600"
            onClick={() => {
              router.push("/inventory");
            }}
          />
          <DashboardCard
            title="Total Purchase Order"
            value={formatPeso(totalPurchaseOrders)}
            icon={Calendar}
            bgColor="bg-blue-600"
            onClick={() => {
              router.push("/purchase-orders");
            }}
          />
        </div>

        {/* Charts - Stack on mobile, side by side on larger screens */}
        <div className="grid grid-cols-1 xl:grid-cols-1 gap-4">
          <div className="border rounded shadow-sm border-gray-200 bg-white p-4">
            <div className="flex justify-between">
              <h1 className="font-semibold mb-2">Sales Chart</h1>
              <div>
                <DynamicDropdown
                  options={[
                    { label: "2024", value: 2024 },
                    { label: "2025", value: 2025 },
                    { label: "2026", value: 2026 },
                  ]}
                  onChange={function (value: string | number): void {
                    setYear(value.toString());
                  }}
                  value={Number(year)}
                  defaultValue={year}
                  placeholder={"Year"}
                  icon={<Calendar className="w-4 h-4" />}
                  size="sm"
                />
              </div>
            </div>
            <div className="h-64 ">
              <Chart data={salesData} />
            </div>
          </div>
          <div className="border rounded shadow-sm border-gray-200 bg-white p-4">
            <div className="flex justify-between">
              <h1 className="font-semibold mb-2">Purchase Order Chart</h1>
              <div>
                <DynamicDropdown
                  options={[
                    { label: "2026", value: 2026 },
                    { label: "2025", value: 2025 },
                    { label: "2024", value: 2024 },
                  ]}
                  onChange={function (value: string | number): void {
                    setYearPO(value.toString());
                  }}
                  value={Number(yearPO)}
                  defaultValue={yearPO}
                  placeholder={"Year"}
                  icon={<Calendar className="w-4 h-4" />}
                  size="sm"
                />
              </div>
            </div>
            <div className="h-64">
              <Chart data={poData} tooltipLabel="Total" />
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-1 flex flex-col gap-4 h-full">
        <div className="border rounded shadow-sm border-gray-200 bg-white p-4">
          <h1 className="font-semibold text-sm mb-3">Daily Store Sales</h1>
          <div className="h-80 space-y-5 overflow-y-auto">
            {storeSales
              .slice() // optional: to avoid mutating original array
              .sort((a, b) => b.sales - a.sales) // descending order
              .map((store) => (
                <StoreCardSales data={store} key={store.id} />
              ))}
          </div>
        </div>

        <div className="border rounded shadow-sm border-gray-200 bg-white p-4">
          <h1 className="font-semibold text-sm mb-3">Recent Store Sales</h1>
          <div className="h-80 space-y-5 overflow-y-auto">
            {recentStoreSales.data
              ?.filter((store) => Number(store.salesTotalAmount) !== 0)
              .map((store) => (
                <StoreRecentSalesCard data={store} key={store.storeId} />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;
