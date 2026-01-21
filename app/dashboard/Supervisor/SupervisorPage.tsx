"use client";

import React from "react";
import DashboardCard from "../components/DashboardCard";
import Chart from "../components/Chart";
import { AlertTriangle, Calendar } from "lucide-react";
import BigCard from "@/components/shared/BigCard";
import Button from "@/components/shared/Button";
import { formatPeso } from "@/utils/formatPeso";
import { useRouter } from "next/navigation";

const SupervisorPage = () => {
  const router = useRouter();
  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 h-full flex flex-col gap-4  pr-5">
        <div className="grid grid-cols-4 gap-5">
          <DashboardCard
            title="Total Sales"
            value={`10`}
            icon={Calendar}
            bgColor="bg-primary-1"
          />
          <DashboardCard
            title="Total Products"
            value={`10`}
            icon={Calendar}
            bgColor="bg-purple-600"
          />
          <DashboardCard
            title="Total Request"
            value={`10`}
            icon={Calendar}
            bgColor="bg-amber-500"
          />
          <DashboardCard
            title="Total Customer"
            value={`10`}
            icon={Calendar}
            bgColor="bg-rose-600"
          />
        </div>
        <div className="flex flex-1">
          <div className="border flex flex-col flex-1 rounded-2xl shadow-sm border-gray-200 bg-white h-full p-4">
            <h1 className="font-semibold">Sales Chart</h1>
            <span className="text-xs text-gray-400">
              Latest Transaction from your store
            </span>
            <Chart />
          </div>
        </div>
        <div className="flex-1 flex gap-4">
          {" "}
          <BigCard
            title={"Recent Sales"}
            subtitle="Latest Transaction from your store"
          >
            {" "}
            {/* Add this wrapper */}
            <div className="flex-1 flex-col flex overflow-auto-y">
              {" "}
              {/* Content grows */}
              {[1, 2, 3, 4].map((item, index) => (
                <div key={index} className="flex flex-col justify-between mb-4">
                  <div className="flex justify-between">
                    <span className="text-sm font-semibold">
                      S000{index + 1}
                    </span>
                    <span className="text-sm font-semibold">
                      {formatPeso(100.0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">
                      Walk-in Customer
                    </span>
                    <span className="text-xs text-gray-500">10:00 AM</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-auto">
              <Button
                size={"sm"}
                label="View Sales"
                onClick={() => {
                  router.push("/sales");
                }}
              />
            </div>
          </BigCard>
          <BigCard
            title={"Low Stock Alert"}
            subtitle="Products running low on inventory"
          >
            <div className="flex flex-1 flex-col justify-center items-center">
              <AlertTriangle
                className="text-center text-orange-600"
                size={50}
              />
              <span className="font-semibold">4 items need attention</span>
              <span className="text-sm text-gray-400">
                Check inventory for low stock items
              </span>
            </div>
            <div className="mt-auto">
              <Button
                size={"sm"}
                label="Manage Inventory"
                onClick={() => {
                  router.push("/inventory?status=low");
                }}
              />
            </div>
          </BigCard>
        </div>
        {/* <div className="flex flex-1">
          <div className="border flex-1 rounded-2xl shadow-sm border-gray-200 bg-white h-full p-4">
            <h1>Recent Sales</h1>
            <span className="text-xs text-gray-400">
              Latest Transaction from your store
            </span>
          </div>
          <div className="border flex-1 rounded-2xl shadow-sm border-gray-200 bg-white h-full p-4">
            <h1>Low Stock Alert</h1>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default SupervisorPage;
