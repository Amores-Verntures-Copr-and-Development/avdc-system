import { SalesStatus } from "@/types/sales";
import React from "react";

const STATUS_CONFIG: Record<
  SalesStatus,
  {
    label: string;
    icon: string;
    bg: string;
    text: string;
    border: string;
    dot: string;
    pulse?: boolean;
  }
> = {
  [SalesStatus.PENDING]: {
    label: "Pending",
    icon: "⏳",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-400",
  },

  [SalesStatus.PENDING_APPROVAL]: {
    label: "Pending Approval",
    icon: "🔔",
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    dot: "bg-orange-500",
    pulse: true,
  },

  [SalesStatus.REJECTED]: {
    label: "Rejected",
    icon: "✕",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
  },

  [SalesStatus.IN_PROGRESS]: {
    label: "In Progress",
    icon: "⚡",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
    pulse: true,
  },

  [SalesStatus.COMPLETED]: {
    label: "Completed",
    icon: "✓",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },

  [SalesStatus.REFUNDED]: {
    label: "Refunded",
    icon: "↩",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-400",
  },

  [SalesStatus.CANCELLED]: {
    label: "Cancelled",
    icon: "✕",
    bg: "bg-slate-100",
    text: "text-slate-500",
    border: "border-slate-200",
    dot: "bg-slate-400",
  },

  [SalesStatus.VOIDED]: {
    label: "Voided",
    icon: "🚫",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
  },
};
const SalesStatusBadge = ({ status }: { status: SalesStatus }) => {
  const cfg = STATUS_CONFIG[status];
  if (!cfg) return null;
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
        text-[9px] 2xl:text-[10px] font-semibold tracking-wide border
        ${cfg.bg} ${cfg.text} ${cfg.border}
        select-none
      `}
    >
      {/* animated dot */}
      <span className="relative flex h-2 w-2">
        {cfg.pulse && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${cfg.dot}`}
          />
        )}
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${cfg.dot}`}
        />
      </span>
      {cfg.label}
    </span>
  );
};

export default SalesStatusBadge;
