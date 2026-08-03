import { Voucher, VoucherStatus } from "@/types/voucher";
import { formatPeso } from "@/utils/formatPeso";
import {
  Ban,
  CalendarClock,
  Printer,
  Repeat,
  Store,
  Ticket,
} from "lucide-react";
import React from "react";
import { MOCK_STORES } from "../mockVoucherData";

interface VoucherCardProps {
  voucher: Voucher;
  onPrint: (voucher: Voucher) => void;
  onVoid: (voucher: Voucher) => void;
}

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

const formatVoucherValue = (voucher: Voucher) => {
  if (voucher.voucherValueType === "fixed") {
    return `${formatPeso(voucher.voucherFixedValue)} credit`;
  }

  const cap = voucher.voucherMaxDiscount
    ? `, cap ${formatPeso(voucher.voucherMaxDiscount)}`
    : ", no cap";

  return `${voucher.voucherPercent}% off${cap}`;
};

const formatUsage = (voucher: Voucher) => {
  if (voucher.voucherValueType === "fixed") {
    return `${formatPeso(voucher.voucherBalance)} left`;
  }

  return `${voucher.voucherUsedCount}/${voucher.voucherMaxUses} used`;
};

const formatRedeemableAt = (voucher: Voucher) => {
  if (voucher.voucherIsAllStores) return "All Stores";

  const names = voucher.voucherStoreIds
    .map((id) => MOCK_STORES.find((s) => s.storeId === id)?.storeName)
    .filter(Boolean);

  if (names.length === 0) return "-";
  if (names.length === 1) return names[0] as string;

  return `${names[0]} +${names.length - 1} more`;
};

const StatTile = ({
  icon,
  iconBg,
  label,
  value,
  full,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  full?: boolean;
}) => (
  <div className={`flex items-start gap-2 ${full ? "col-span-2" : ""}`}>
    <div
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${iconBg}`}
    >
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[9px] font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p className="truncate text-xs font-semibold text-gray-800">{value}</p>
    </div>
  </div>
);

const VoucherCard = ({ voucher, onPrint, onVoid }: VoucherCardProps) => {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-primary-1">
            {voucher.voucherCode}
          </p>
          {voucher.voucherName && (
            <p className="truncate text-xs text-gray-400">
              {voucher.voucherName}
            </p>
          )}
        </div>

        <span
          className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${statusDotStyles[voucher.voucherStatus]}`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${statusDotColor[voucher.voucherStatus]}`}
          />
          {voucher.voucherStatus}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatTile
          icon={<Ticket className="h-3 w-3 text-primary-1" />}
          iconBg="bg-pink-100"
          label="Value"
          value={formatVoucherValue(voucher)}
        />
        <StatTile
          icon={<Repeat className="h-3 w-3 text-indigo-600" />}
          iconBg="bg-indigo-100"
          label="Usage"
          value={formatUsage(voucher)}
        />
        <StatTile
          icon={<Store className="h-3 w-3 text-green-600" />}
          iconBg="bg-green-100"
          label="Redeemable At"
          value={formatRedeemableAt(voucher)}
        />
        <StatTile
          icon={<CalendarClock className="h-3 w-3 text-amber-600" />}
          iconBg="bg-amber-100"
          label="Expiry"
          value={voucher.voucherExpiresAt ?? "No expiry"}
        />
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-2">
        <button
          type="button"
          title="Print"
          className="flex items-center gap-1 text-[11px] font-medium text-gray-500 hover:text-gray-800"
          onClick={() => onPrint(voucher)}
        >
          <Printer className="h-3.5 w-3.5" />
          Print
        </button>

        {voucher.voucherStatus === "active" && (
          <button
            type="button"
            title="Void"
            className="flex items-center gap-1 text-[11px] font-medium text-rose-500 hover:text-rose-700"
            onClick={() => onVoid(voucher)}
          >
            <Ban className="h-3.5 w-3.5" />
            Void
          </button>
        )}
      </div>
    </div>
  );
};

export default VoucherCard;
