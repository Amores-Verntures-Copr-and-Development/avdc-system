import React from "react";
import DashboardCard from "../components/DashboardCard";
import Chart from "../components/Chart";
import {
  Calendar,
  Package,
  AlertTriangle,
  ShoppingCart,
  TrendingUp,
  Clock,
} from "lucide-react";
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

const StatCard = ({
  title,
  value,
  icon: Icon,
  accent,
  trend,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  accent: string;
  trend?: string;
}) => (
  <div
    className={`
      relative overflow-hidden rounded-xl p-4 sm:p-5 bg-white
      border border-gray-100 shadow-sm
      hover:shadow-md hover:-translate-y-0.5
      transition-all duration-200
    `}
  >
    {/* Accent bar */}
    <div className={`absolute top-0 left-0 right-0 h-0.5 ${accent}`} />

    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 truncate">
          {title}
        </p>
        <p className="mt-1.5 text-sm 2xl:text-2xl font-bold text-gray-800 tracking-tight truncate">
          {value}
        </p>
        {trend && (
          <p className="mt-1 text-[11px] text-emerald-600 font-medium flex items-center gap-0.5">
            <TrendingUp size={10} />
            {trend}
          </p>
        )}
      </div>
      <div
        className={`
          flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-xl
          flex items-center justify-center
          ${accent.replace("bg-", "bg-").replace("-500", "-50").replace("-600", "-50").replace("-700", "-50")}
        `}
        style={{ background: "rgba(0,0,0,0.04)" }}
      >
        <Icon size={18} className="text-gray-600" />
      </div>
    </div>
  </div>
);

const SectionCard = ({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`
      rounded-xl border border-gray-100 bg-white shadow-sm
      flex flex-col overflow-hidden
      ${className}
    `}
  >
    <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3 border-b border-gray-50 flex items-center justify-between gap-2">
      <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
      {subtitle && (
        <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
          {subtitle}
        </span>
      )}
    </div>
    <div className="flex-1 p-4 sm:p-5">{children}</div>
  </div>
);

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

  const defaultStats: DashboardStats = {
    totalPurchase: 0,
    inventoryCost: 0,
    lowStock: 0,
    outOfStock: 0,
  };

  const stats = dashboardStats?.data[0] ?? defaultStats;
  const pendingCount = pendingRequest?.data?.length ?? 0;

  return (
    <div className="min-h-0 flex flex-col gap-2 overflow-auto">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 ">
        <StatCard
          title="Inventory Cost"
          value={formatPeso(stats.inventoryCost)}
          icon={ShoppingCart}
          accent="bg-blue-500"
        />
        <StatCard
          title="Total Purchase"
          value={formatPeso(stats.totalPurchase ?? 0)}
          icon={Calendar}
          accent="bg-violet-500"
        />
        <StatCard
          title="Low Stock"
          value={`${stats.lowStock ?? 0} items`}
          icon={AlertTriangle}
          accent="bg-amber-500"
        />
        <StatCard
          title="Out of Stock"
          value={`${stats.outOfStock ?? 0} items`}
          icon={Package}
          accent="bg-rose-500"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-3 sm:gap-4">
        {/* Left: Charts */}
        <div className="xl:col-span-3 flex flex-col gap-3 sm:gap-4">
          <SectionCard title="Purchase Spending Trend">
            <div className="h-52 sm:h-64">
              <Chart />
            </div>
          </SectionCard>

          <SectionCard title="Current Schedule Request">
            <div className="h-52 sm:h-64">
              <Chart />
            </div>
          </SectionCard>
        </div>

        {/* Right: Sidebar */}
        <div className="xl:col-span-1 flex flex-col gap-3 sm:gap-4">
          {/* Pending Requests */}
          <SectionCard
            title="Pending Requests"
            subtitle={`${pendingCount} total`}
            className="flex-1 min-h-0"
          >
            <div className="flex flex-col gap-2 max-h-72 xl:max-h-[26rem] overflow-y-auto pr-0.5">
              {pendingCount > 0 ? (
                pendingRequest.data.map((ro) => (
                  <StoreRequestOrder data={ro} key={ro.requestId} />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                    <Clock size={18} className="text-emerald-500" />
                  </div>
                  <p className="text-sm font-medium text-gray-600">
                    All caught up!
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    No pending requests
                  </p>
                </div>
              )}
            </div>
          </SectionCard>

          {/* Top Purchased Items */}
          <SectionCard title="Top Purchased Items" className="flex-1 min-h-0">
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
              {/* Placeholder state */}
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                  <TrendingUp size={18} className="text-gray-400" />
                </div>
                <p className="text-xs text-gray-400">No data available</p>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

export default PurchaserDashboard;
