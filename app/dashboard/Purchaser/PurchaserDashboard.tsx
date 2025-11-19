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
  const {} = useSWR<ApiResponse<DashboardStats[]>>(
    `/api/dashboard/purchaser/total-cards`,
    fetcher
  );

  // Provide proper default values
  // const defaultStats: DashboardStats = {
  //   totalPurchase: 0,
  //   pendingRequest: 0,
  //   lowStock: 0,
  //   outOfStock: 0,
  // };

  // const stats = dashboardStats?.data[0] ?? defaultStats;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full overflow-y-auto p-2">
      <div className="lg:col-span-3  flex flex-1 flex-col gap-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <DashboardCard
            title="Total Purchase"
            value={0}
            icon={ShoppingCart}
            bgColor="bg-primary-1"
          />
          <DashboardCard
            title="Pending Request"
            value={0}
            icon={Calendar}
            bgColor="bg-purple-600"
          />
          <DashboardCard
            title="Low Stock"
            value={0}
            icon={AlertTriangle}
            bgColor="bg-amber-500"
          />
          <DashboardCard
            title="Out of Stock"
            value={0}
            icon={Package}
            bgColor="bg-rose-600"
          />
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="border rounded-2xl shadow-sm border-gray-200 bg-white p-4">
            <h1>Purchase Spending Trend</h1>
            <div className="h-64 ">
              {" "}
              <Chart />
            </div>
          </div>
          <div className="border rounded-2xl shadow-sm border-gray-200 bg-white p-4">
            <h1>Current Schedule Request</h1>
            <div className="h-64 ">
              {" "}
              <Chart />
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-1 flex flex-col gap-4">
        <div className="border rounded-2xl shadow-sm border-gray-200 bg-white p-4">
          <h1 className="font-semibold text-sm mb-3">
            Current Schedule Request
          </h1>
          <div className="h-64 space-y-5 overflow-y-auto">
            {/* {storeSales.map((store) => (
              <StoreCardSales data={store} key={store.id} />
            ))} */}
          </div>
        </div>
        <div className="border rounded-2xl shadow-sm border-gray-200 bg-white p-4">
          <h1 className="font-semibold text-sm mb-3">Top Purchased Items</h1>
          <div className="h-64 overflow-y-auto">
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
