"use client";
import React from "react";
import DashboardCard from "../components/DashboardCard";
import StoreCardSales from "../components/StoreCardSales";
import Chart from "../components/Chart";
import useSWR from "swr";
import { fetcher } from "@/utils/fetcher";
import { Calendar } from "lucide-react";
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

const storeData: Store[] = [
  { id: 1, name: "Main Branch", sales: 25430, growth: 5.2 },
  { id: 2, name: "Downtown", sales: 18750, growth: 3.8 },
  { id: 3, name: "Mall Kiosk", sales: 9400, growth: -2.1 },
  { id: 4, name: "Online Store", sales: 30320, growth: 7.5 },
];
const OwnerDashboard = () => {
  const { data: dailyStoreSales = { data: [] } } =
    useSWR<DailyStoreSalesResponse>(
      `/api/dashboard/store-daily-sales/`,
      fetcher
    );
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
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full overflow-y-auto p-2">
      {/* Main Content - 3/4 on desktop, full on mobile */}
      <div className="lg:col-span-3  flex flex-1 flex-col gap-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <DashboardCard title="Total Purchase" value={10} icon={Calendar} />
          <DashboardCard title="Total Purchase" value={10} icon={Calendar} />
          <DashboardCard title="Total Purchase" value={10} icon={Calendar} />
          <DashboardCard title="Total Purchase" value={10} icon={Calendar} />
        </div>

        {/* Charts - Stack on mobile, side by side on larger screens */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="border rounded-2xl shadow-sm border-gray-200 bg-white p-4">
            <h1 className="font-semibold mb-2">Sales Chart</h1>
            <div className="h-64 ">
              <Chart />
            </div>
          </div>
          <div className="border rounded-2xl shadow-sm border-gray-200 bg-white p-4">
            <h1 className="font-semibold mb-2">Top Performer</h1>
            <div className="h-64">
              <Chart />
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar - 1/4 on desktop, full on mobile */}
      <div className="lg:col-span-1 flex flex-col gap-4">
        <div className="border rounded-2xl shadow-sm border-gray-200 bg-white p-4">
          <h1 className="font-semibold text-sm mb-3">Daily Store Sales</h1>
          <div className="h-64 space-y-5 overflow-y-auto">
            {storeSales.map((store) => (
              <StoreCardSales data={store} key={store.id} />
            ))}
          </div>
        </div>

        <div className="border rounded-2xl shadow-sm border-gray-200 bg-white p-4">
          <h1 className="font-semibold text-sm mb-3">Top Performer Store</h1>
          <div className="h-64 overflow-y-auto">
            {storeData.map((store) => (
              <StoreCardSales data={store} key={store.id} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;
