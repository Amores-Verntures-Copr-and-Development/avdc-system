import React from "react";
import DashboardCard from "../components/DashboardCard";
import Chart from "../components/Chart";
import { Calendar, Package, AlertTriangle, ShoppingCart } from "lucide-react";
import { ApiResponse } from "@/types/api";
import useSWR from "swr";
import { fetcher } from "@/utils/fetcher";
import { useSession } from "@/hooks/useSession";
import StoreRequestOrder from "./_components/StoreRequestOrder";
import { Request } from "@/types/request";
import { StoreInterface } from "@/types/stores";
import { formatPeso } from "@/utils/formatPeso";

interface DashboardStats {
  totalPurchase: number;
  inventoryCost: number;
  lowStock: number;
  outOfStock: number;
}

interface PendingRequest extends Request, StoreInterface {
  requestItemsCount: number;
}

const PurchaserDashboard = () => {
  const { user } = useSession();
  const { data: dashboardStats = { data: [] } } = useSWR<
    ApiResponse<DashboardStats[]>
  >(
    user ? `/api/dashboard/purchaser/${user?.userId}/total-cards` : null,
    fetcher,
  );
  const { data: pendingRequest = { data: [] } } = useSWR<
    ApiResponse<PendingRequest[]>
  >(
    user ? `/api/dashboard/purchaser/${user?.userId}/pending-request` : null,
    fetcher,
  );

  // Provide proper default values
  const defaultStats: DashboardStats = {
    totalPurchase: 0,
    inventoryCost: 0,
    lowStock: 0,
    outOfStock: 0,
  };

  const stats = dashboardStats?.data[0] ?? defaultStats;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full overflow-y-auto p-2">
      <div className="lg:col-span-3  flex flex-1 flex-col gap-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <DashboardCard
            title="Total Inventory Cost"
            value={`${formatPeso(stats.inventoryCost)}`}
            icon={ShoppingCart}
            bgColor="bg-primary-1"
          />
          <DashboardCard
            title="Total Purchase"
            value={formatPeso(stats.totalPurchase ?? 0)}
            icon={Calendar}
            bgColor="bg-purple-600"
          />
          <DashboardCard
            title="Low Stock"
            value={`${stats.lowStock ?? 0}`}
            icon={AlertTriangle}
            bgColor="bg-amber-500"
          />
          <DashboardCard
            title="Out of Stock"
            value={`${stats.outOfStock ?? 0}`}
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
          <div className="flex justify-between items-center mb-3">
            <h1 className="font-semibold text-sm">Pending Request</h1>
            <span className="text-xs">
              {pendingRequest?.data.length} request
            </span>
          </div>
          <div className="h-70 flex flex-col gap-2 overflow-y-auto">
            {pendingRequest?.data && pendingRequest.data.length > 0 ? (
              pendingRequest?.data.map((ro) => (
                <StoreRequestOrder data={ro} key={ro.requestId} />
              ))
            ) : (
              <div className="flex flex-1 flex-col justify-center items-center text-center align-middle">
                <span className="bg-green-200 py-1.5 px-2 rounded">
                  No pending request!
                </span>
              </div>
            )}
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
