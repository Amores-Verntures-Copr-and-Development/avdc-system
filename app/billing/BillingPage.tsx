"use client";

import PageHeader from "@/components/shared/PageHeader";
import PageLayout from "@/components/shared/PageLayout";
import { ApiResponse } from "@/types/api";
import { DisplayBillingDto } from "@/dtos/billing.dto";
import { fetcher } from "@/utils/fetcher";
import { Clock, CreditCard, Receipt, Store } from "lucide-react";
import React from "react";
import useSWR from "swr";
import DashboardCard from "@/app/dashboard/components/DashboardCard";

const formatCurrency = (value: number) =>
  `₱${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const BillingPage = () => {
  const { data: response } = useSWR<ApiResponse<DisplayBillingDto>>(
    "/api/billing",
    fetcher,
  );
  const billing = response?.data;
  const atLimit =
    billing != null && billing.activeStoreCount >= billing.maxStores;

  return (
    <PageLayout className="p-2 gap-2">
      <PageHeader
        title={"Billing"}
        subtitle="Your current store count and estimated monthly bill."
      />

      <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 p-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100">
          <Clock className="h-4 w-4 text-amber-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-amber-800">
            Working on it soon
          </p>
          <p className="text-xs text-amber-700">
            Billing invoices aren&apos;t live yet — the numbers below are a
            preview of your current usage.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <DashboardCard
          title="Active Stores"
          icon={Store}
          value={billing ? `${billing.activeStoreCount} / ${billing.maxStores}` : "-"}
        />
        <DashboardCard
          title="Price per Store"
          icon={CreditCard}
          value={billing ? formatCurrency(billing.pricePerStore) : "-"}
        />
        <DashboardCard
          title="Estimated Bill"
          icon={Receipt}
          value={billing ? formatCurrency(billing.estimatedBill) : "-"}
        />
      </div>

      {atLimit && (
        <p className="text-xs text-gray-500">
          You&apos;ve reached your store limit ({billing?.maxStores}). Need to
          add more? Ask your Super Admin to increase your maximum store
          limit.
        </p>
      )}
    </PageLayout>
  );
};

export default BillingPage;
