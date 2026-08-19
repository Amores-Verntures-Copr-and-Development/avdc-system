"use client";

import LoaderComponent from "@/components/shared/LoaderComponent";
import PageLayout from "@/components/shared/PageLayout";
import SectionHeader from "@/components/shared/SectionHeader";
import Table, { Column } from "@/components/shared/Table";
import { ApiResponse } from "@/types/api";
import { StoreInterface } from "@/types/stores";
import { DisplayVoucher, VoucherRedemption, VoucherStatus } from "@/types/voucher";
import { fetcher } from "@/utils/fetcher";
import { formatDateToWords } from "@/utils/formatDateToWords";
import { formatPeso } from "@/utils/formatPeso";
import {
  ArrowLeft,
  CalendarClock,
  ListOrdered,
  Receipt,
  Repeat,
  Store,
  Ticket,
  User,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useMemo } from "react";
import useSWR from "swr";

const statusDotStyles: Record<VoucherStatus, string> = {
  active: "bg-green-100 text-green-700",
  redeemed: "bg-blue-100 text-blue-700",
  expired: "bg-amber-100 text-amber-700",
  void: "bg-rose-100 text-rose-700",
};

const statusDotColor: Record<VoucherStatus, string> = {
  active: "bg-green-500",
  redeemed: "bg-blue-500",
  expired: "bg-amber-500",
  void: "bg-rose-500",
};

const formatVoucherValue = (voucher: DisplayVoucher) => {
  if (voucher.voucherValueType === "fixed") {
    return `${formatPeso(voucher.voucherFixedValue)} credit`;
  }

  const cap = voucher.voucherMaxDiscount
    ? `, cap ${formatPeso(voucher.voucherMaxDiscount)}`
    : ", no cap";

  return `${voucher.voucherPercent}% off${cap}`;
};

const formatUsage = (voucher: DisplayVoucher) => {
  if (voucher.voucherValueType === "fixed") {
    return `${formatPeso(voucher.voucherBalance)} left`;
  }

  return `${voucher.voucherUsedCount}/${voucher.voucherMaxUses} used`;
};

const StatTile = ({
  icon,
  iconBg,
  label,
  value,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
}) => (
  <div className="flex items-start gap-2">
    <div
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
    >
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p className="truncate text-sm font-semibold text-gray-800">{value}</p>
    </div>
  </div>
);

const VoucherDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const { voucherId } = params;

  const { data: voucherRes, isLoading } = useSWR<ApiResponse<DisplayVoucher>>(
    voucherId ? `/api/vouchers/${voucherId}` : null,
    fetcher,
  );

  const { data: redemptionsRes, isLoading: isLoadingRedemptions } = useSWR<
    ApiResponse<VoucherRedemption[]>
  >(voucherId ? `/api/vouchers/${voucherId}/redemptions` : null, fetcher);

  const { data: storesRes } = useSWR<ApiResponse<StoreInterface[]>>(
    "/api/stores",
    fetcher,
  );

  const voucher = voucherRes?.data;
  const redemptions = redemptionsRes?.data ?? [];

  const redeemableAt = useMemo(() => {
    if (!voucher) return "-";
    if (voucher.voucherIsAllStores) return "All Stores";

    const stores = storesRes?.data ?? [];
    const names = (voucher.storeIds ?? [])
      .map((id) => stores.find((s) => s.storeId === id)?.storeName)
      .filter(Boolean);

    if (names.length === 0) return "-";
    if (names.length === 1) return names[0] as string;

    return `${names[0]} +${names.length - 1} more`;
  }, [voucher, storesRes]);

  const columns: Column<VoucherRedemption>[] = [
    {
      key: "source",
      name: "Type",
      selector: (row) => (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
            row.source === "sale"
              ? "bg-primary-1/10 text-primary-1"
              : "bg-orange-100 text-orange-600"
          }`}
        >
          {row.source === "sale" ? (
            <Receipt className="h-3 w-3" />
          ) : (
            <ListOrdered className="h-3 w-3" />
          )}
          {row.source}
        </span>
      ),
    },
    {
      key: "referenceNo",
      name: "Reference",
      selector: (row) => (
        <span className="font-semibold">{row.referenceNo ?? "-"}</span>
      ),
    },
    {
      key: "customerName",
      name: "Redeemed By",
      selector: (row) => row.customerName ?? "Walk-in Customer",
    },
    {
      key: "redeemedByName",
      name: "Processed By",
      selector: (row) => row.redeemedByName ?? "-",
    },
    {
      key: "storeName",
      name: "Store",
      selector: (row) => row.storeName ?? "-",
    },
    {
      key: "appliedAmount",
      name: "Applied Amount",
      selector: (row) => (
        <span className="font-semibold">{formatPeso(row.appliedAmount)}</span>
      ),
    },
    {
      key: "referenceCreatedAt",
      name: "Date",
      selector: (row) => formatDateToWords(row.referenceCreatedAt),
    },
  ];

  if (isLoading) return <LoaderComponent />;

  if (!voucher) {
    return (
      <PageLayout className="p-4">
        <div>No voucher found with that ID: {voucherId}</div>
      </PageLayout>
    );
  }

  return (
    <PageLayout className="gap-4 p-2">
      <button
        onClick={() => router.back()}
        className="inline-flex w-fit items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-primary-1"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Vouchers
      </button>

      <div className="flex flex-col gap-5 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <SectionHeader
            icon={Ticket}
            title={voucher.voucherCode}
            subtitle={voucher.voucherName ?? undefined}
          />

          <span
            className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusDotStyles[voucher.voucherStatus]}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${statusDotColor[voucher.voucherStatus]}`}
            />
            {voucher.voucherStatus}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 sm:grid-cols-3 xl:grid-cols-6">
          <StatTile
            icon={<Ticket className="h-4 w-4 text-primary-1" />}
            iconBg="bg-pink-100"
            label="Value"
            value={formatVoucherValue(voucher)}
          />
          <StatTile
            icon={<Repeat className="h-4 w-4 text-indigo-600" />}
            iconBg="bg-indigo-100"
            label="Usage"
            value={formatUsage(voucher)}
          />
          <StatTile
            icon={<Store className="h-4 w-4 text-green-600" />}
            iconBg="bg-green-100"
            label="Redeemable At"
            value={redeemableAt}
          />
          <StatTile
            icon={<CalendarClock className="h-4 w-4 text-amber-600" />}
            iconBg="bg-amber-100"
            label="Expiry"
            value={voucher.voucherExpiresAt ?? "No expiry"}
          />
          <StatTile
            icon={<User className="h-4 w-4 text-blue-600" />}
            iconBg="bg-blue-100"
            label="Issued To"
            value={voucher.voucherIssuedToName ?? "Anyone (bearer)"}
          />
          <StatTile
            icon={<User className="h-4 w-4 text-gray-600" />}
            iconBg="bg-gray-100"
            label="Issued By"
            value={voucher.voucherIssuedByName ?? "-"}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <Table
          title="Redemption History"
          subtitle="Who redeemed this voucher, and on what sale or order."
          columns={columns}
          data={redemptions}
          loading={isLoadingRedemptions}
          isRounded={false}
          maxHeight="h-full"
          Datalabel="No redemptions yet"
          onRowSelection={(row) =>
            router.push(
              row.source === "sale"
                ? `/sales/${row.referenceId}`
                : `/orders/${row.referenceId}`,
            )
          }
        />
      </div>
    </PageLayout>
  );
};

export default VoucherDetailPage;
