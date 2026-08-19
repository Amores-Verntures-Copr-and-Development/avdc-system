"use client";

import React from "react";
import DashboardCard from "../components/DashboardCard";
import Chart from "../components/Chart";
import { AlertTriangle, Calendar, ListOrdered } from "lucide-react";
import BigCard from "@/components/shared/BigCard";
import Button from "@/components/shared/Button";
import { formatPeso } from "@/utils/formatPeso";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { fetcher } from "@/utils/fetcher";
import { useSession } from "@/hooks/useSession";
import { DisplaySalesDto } from "@/dtos/sales.dto";
import { DisplayOrderDto } from "@/dtos/orders.dto";
import { ApiResponse } from "@/types/api";
import { StoreInterface } from "@/types/stores";
import { formatDateToWords } from "@/utils/formatDateToWords";
import LoaderComponent from "@/components/shared/LoaderComponent";
import PageHeader from "@/components/shared/PageHeader";
import PageLayout from "@/components/shared/PageLayout";

const SupervisorPage = () => {
  const router = useRouter();
  const { user } = useSession();
  const { data: storeDashboard = { data: [] }, isLoading } = useSWR<any>(
    user ? `/api/dashboard/stores/${user?.storeId}` : null,
    fetcher,
  );
  const { data: currentStoreRes } = useSWR<ApiResponse<StoreInterface[]>>(
    user?.storeId ? `/api/stores/${user.storeId}` : null,
    fetcher,
  );
  const currentStore = currentStoreRes?.data?.[0];
  const isOrderEnabled = !!currentStore?.storeOrderEnabled;

  const { data: newOrdersRes } = useSWR<ApiResponse<DisplayOrderDto[]>>(
    user?.storeId && isOrderEnabled
      ? `/api/order/${user.storeId}?status=PENDING&limit=5`
      : null,
    fetcher,
    { refreshInterval: 30000 },
  );
  const newOrders = newOrdersRes?.data ?? [];
  const newOrdersCount = newOrdersRes?.count ?? 0;

  const salesDetails = storeDashboard.data?.widgets;
  const salesChart = storeDashboard.data?.salesChart;
  const recentSales = storeDashboard.data?.recentSales as DisplaySalesDto[];
  const salesChartData = salesChart ?? [];
  const salesData = salesChartData.map((item: any) => ({
    name: item.month,
    value: Number(item.totalSales),
  }));

  if (isLoading) {
    return <LoaderComponent />;
  }

  return (
    <PageLayout>
      <div>
        <PageHeader
          title={"Dashboard"}
          subtitle="Welcome back! Here's your system overview."
        />
      </div>
      <div className="flex-1 flex flex-col gap-4 pr-4 sm:pr-5 overflow-auto h-full">
        {/* Dashboard Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <DashboardCard
            title="Total Sales"
            value={`${formatPeso(salesDetails?.salesDetails[0]?.totalSales || 0)}`}
            icon={Calendar}
            bgColor="bg-primary-1"
          />
          <DashboardCard
            title="Total Products"
            value={salesDetails?.totalProducts || 0}
            icon={Calendar}
            bgColor="bg-purple-600"
          />
          <DashboardCard
            title="Total Request"
            value={`${salesDetails?.totalRequest?.total || 0}`}
            icon={Calendar}
            bgColor="bg-amber-500"
          />
          <DashboardCard
            title="Total Customer"
            value={`${salesDetails?.salesDetails[0]?.totalCustomer || 0}`}
            icon={Calendar}
            bgColor="bg-rose-600"
          />
        </div>
        <BigCard
          title={"Sales Chart"}
          subtitle="Latest Transaction from your store"
          isRounded={false}
        >
          {" "}
          <div className="flex-1 mt-2 min-h-30">
            <Chart data={salesData} />
          </div>
        </BigCard>
        {/* Recent Sales & Low Stock */}
        <div className="flex flex-1 flex-col 2xl:flex-row gap-4">
          {/* Recent Sales */}
          <BigCard
            title="Recent Sales"
            subtitle="Latest Transaction from your store"
            isRounded={false}
          >
            <div className="flex-1 flex flex-col gap-2 overflow-y-auto max-h-96">
              {recentSales?.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col justify-between border-b border-gray-100 pb-2"
                >
                  <div className="flex justify-between">
                    <span className="text-sm font-semibold">
                      {item.salesNo}
                    </span>
                    <span className="text-sm font-semibold">
                      {formatPeso(item.salesTotalAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">
                      {item.customerId ? item.customerName : "Walk-in Customer"}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDateToWords(item.salesCreatedAt, {
                        showHourAndMinuteOnly: true,
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 self-end">
              <Button
                size="sm"
                label="View Sales"
                onClick={() => router.push("/sales")}
              />
            </div>
          </BigCard>

          {/* New Orders */}
          {isOrderEnabled && (
            <BigCard
              title="New Orders"
              subtitle="Orders waiting to be confirmed"
              isRounded={false}
              isHover
              leftTitle={
                newOrdersCount > 0 && (
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-orange-500 px-1.5 text-xs font-bold text-white">
                    {newOrdersCount > 99 ? "99+" : newOrdersCount}
                  </span>
                )
              }
            >
              <div className="flex-1 flex flex-col gap-2 overflow-y-auto max-h-96">
                {newOrders.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
                    <ListOrdered className="text-gray-300" size={40} />
                    <span className="mt-2 text-sm text-gray-400">
                      No new orders
                    </span>
                  </div>
                ) : (
                  newOrders.map((item) => (
                    <div
                      onClick={() => router.push(`/orders/${item.orderId}`)}
                      key={item.orderId}
                      className="flex flex-col justify-between rounded-lg border-b border-gray-100 px-2 pb-2 transition-colors hover:bg-gray-50"
                    >
                      <div className="flex justify-between">
                        <span className="text-sm font-semibold">
                          {item.orderNumber}
                        </span>
                        <span className="text-sm font-semibold">
                          {formatPeso(item.totalAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">
                          {item.customerId
                            ? item.customerName
                            : "Walk-in Customer"}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDateToWords(item.orderCreatedAt, {
                            showHourAndMinuteOnly: true,
                          })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </BigCard>
          )}

          {/* Low Stock */}

          <BigCard
            title="Low Stock Alert"
            isRounded={false}
            subtitle="Products running low on inventory"
          >
            <div className="flex flex-col justify-center items-center flex-1">
              <AlertTriangle className="text-orange-600" size={50} />
              <span className="font-semibold mt-2">4 items need attention</span>
              <span className="text-sm text-gray-400">
                Check inventory for low stock items
              </span>
            </div>
            <div className="mt-2 self-end">
              <Button
                size="sm"
                label="Manage Inventory"
                onClick={() => router.push("/inventory?status=low")}
              />
            </div>
          </BigCard>
        </div>
      </div>
    </PageLayout>
  );
};

export default SupervisorPage;
