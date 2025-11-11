import React from "react";
import DashboardCard from "../components/DashboardCard";
import Chart from "../components/Chart";
import { Calendar, Package, AlertTriangle, ShoppingCart } from "lucide-react";
import { ApiResponse } from "@/types/api";
import useSWR from "swr";
import { fetcher } from "@/utils/fetcher";

interface DashboardStats {
  totalPurchase: number;
  pendingRequest: number;
  lowStock: number;
  outOfStock: number;
}

const PurchaserDashboard = () => {
  const {
    data: dashboardStats,
    error,
    isLoading,
  } = useSWR<ApiResponse<DashboardStats[]>>(
    `/api/dashboard/purchaser/total-cards`,
    fetcher
  );

  // Provide proper default values
  const defaultStats: DashboardStats = {
    totalPurchase: 0,
    pendingRequest: 0,
    lowStock: 0,
    outOfStock: 0,
  };

  const stats = dashboardStats?.data[0] || defaultStats;

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 h-full flex flex-col gap-4 pr-5">
        <div className="grid grid-cols-4 gap-5">
          <DashboardCard
            title="Total Purchase"
            value={stats.totalPurchase}
            icon={ShoppingCart}
            bgColor="bg-primary-1"
          />
          <DashboardCard
            title="Pending Request"
            value={stats.pendingRequest}
            icon={Calendar}
            bgColor="bg-purple-600"
          />
          <DashboardCard
            title="Low Stock"
            value={stats.lowStock}
            icon={AlertTriangle}
            bgColor="bg-amber-500"
          />
          <DashboardCard
            title="Out of Stock"
            value={stats.outOfStock}
            icon={Package}
            bgColor="bg-rose-600"
          />
        </div>
        <div className="border rounded-2xl shadow-sm border-gray-200 bg-white h-full p-4">
          <h1>Purchase Spending Trend</h1>
          <Chart />
        </div>
        <div className="border rounded-2xl shadow-sm border-gray-200 bg-white h-full p-4">
          <h1>Top Performer</h1>
        </div>
      </div>

      <div className="flex-[.30] flex flex-col h-full gap-4">
        <div className="flex-1 flex flex-col min-h-0 p-4 border rounded-2xl shadow-sm border-gray-200 bg-white">
          <h1 className="font-semibold text-sm">Current Schedule Request</h1>
          <div className="flex-1 flex flex-col gap-2 overflow-auto">
            {/* {storeSales.map((store) => (
              <StoreCardSales data={store} key={store.id} />
            ))} */}
          </div>
        </div>
        <div className="flex-1 flex flex-col min-h-0 p-4 border rounded-2xl shadow-sm border-gray-200 bg-white">
          <h1 className="font-semibold text-sm">Top Purchased Items</h1>
          <div className="flex-1 flex flex-col gap-2 overflow-auto">
            {/* {storeData.map((store) => (
              <StoreCardSales data={store} key={store.id} />
            ))} */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaserDashboard;
