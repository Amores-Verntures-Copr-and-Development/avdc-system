"use client";
import React from "react";
import DashboardCard from "../components/DashboardCard";
import StoreCardSales from "../components/StoreCardSales";
import Chart from "../components/Chart";
import useSWR from "swr";
import { fetcher } from "@/utils/fetcher";
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
  const {
    data: dailyStoreSales = { data: [] },
    isLoading,
    mutate: mutateInventory,
  } = useSWR<DailyStoreSalesResponse>(
    `/api/dashboard/store-daily-sales/`,
    fetcher
  );
  console.log({ dailyStoreSales });
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
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 h-full flex flex-col gap-4  pr-5">
        <div className="grid grid-cols-4 gap-5">
          <DashboardCard />
          <DashboardCard />
          <DashboardCard />
          <DashboardCard />
        </div>
        <div className="border rounded-2xl shadow-sm border-gray-200 bg-white h-full p-4">
          <h1>Sales Chart</h1>
          <Chart />
        </div>
        <div className="border rounded-2xl shadow-sm border-gray-200 bg-white h-full p-4">
          <h1>Top Performer</h1>
        </div>
      </div>

      <div className="flex-[.30] flex flex-col h-full  gap-4">
        <div className="flex-1 flex flex-col min-h-0 p-4 border rounded-2xl shadow-sm border-gray-200 bg-white">
          <h1 className="font-semibold text-sm">Daily Store Sales</h1>
          <div className="flex-1 flex flex-col gap-2 overflow-auto">
            {storeSales.map((store) => (
              <StoreCardSales data={store} key={store.id} />
            ))}
          </div>
        </div>{" "}
        <div className="flex-1 flex flex-col min-h-0 p-4 border rounded-2xl shadow-sm border-gray-200 bg-white">
          <h1 className="font-semibold text-sm">Top Performer Store</h1>
          <div className="flex-1 flex flex-col gap-2 overflow-auto">
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
