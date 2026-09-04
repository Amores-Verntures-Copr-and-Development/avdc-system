"use client";

import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import Modal from "@/components/shared/Modal";
import PageHeader from "@/components/shared/PageHeader";
import PageLayout from "@/components/shared/PageLayout";
import Table, { Column } from "@/components/shared/Table";
import { ApiResponse } from "@/types/api";
import { DisplayInstallmentDetail, InstallmentCheck } from "@/types/installments";
import { fetcher } from "@/utils/fetcher";
import { formatPeso } from "@/utils/formatPeso";
import { ArrowLeft, MoreVertical } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import useSWR from "swr";

const todayStr = () => new Date().toISOString().slice(0, 10);

const statusStyles: Record<string, string> = {
  pending: "bg-amber-50 text-amber-600",
  deposited: "bg-emerald-50 text-emerald-600",
  bounced: "bg-rose-50 text-rose-600",
  cancelled: "bg-gray-100 text-gray-500",
};

// A row's 3-dot action menu - mirrors the floating-portal pattern Table.tsx
// itself uses for its mobile top-action menu, so this looks native to the
// rest of the app instead of introducing a new interaction style.
const CheckActionsMenu = ({
  onDeposit,
  onVoid,
  onCancel,
}: {
  onDeposit: () => void;
  onVoid: () => void;
  onCancel: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuWidth = 140;

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleToggle = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.right + window.scrollX - menuWidth,
      });
    }
    setOpen((prev) => !prev);
  };

  const items: { label: string; onClick: () => void; className: string }[] = [
    { label: "Deposit", onClick: onDeposit, className: "text-emerald-600" },
    { label: "Void", onClick: onVoid, className: "text-rose-600" },
    { label: "Cancel", onClick: onCancel, className: "text-gray-500" },
  ];

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open &&
        typeof window !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "absolute",
              top: position.top,
              left: position.left,
              width: menuWidth,
              zIndex: 9999,
            }}
            className="rounded-xl border border-gray-100 bg-white p-1 shadow-xl"
          >
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  item.onClick();
                  setOpen(false);
                }}
                className={`w-full rounded-lg px-3 py-2 text-left text-xs font-medium transition hover:bg-gray-50 ${item.className}`}
              >
                {item.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
};

const InstallmentDetailPage = () => {
  const router = useRouter();
  const params = useParams<{ installmentId: string }>();
  const searchParams = useSearchParams();
  const storeId = searchParams.get("storeId");
  const installmentId = params.installmentId;

  const apiUrl =
    storeId && installmentId
      ? `/api/installments/${storeId}/${installmentId}`
      : null;

  const { data: response, isLoading, mutate } = useSWR<
    ApiResponse<DisplayInstallmentDetail>
  >(apiUrl, fetcher);

  const installment = response?.data;

  const summary = useMemo(() => {
    const checks = installment?.checks ?? [];
    const deposited = checks.filter(
      (c) => c.installmentCheckStatus === "deposited",
    );
    const pending = checks.filter(
      (c) => c.installmentCheckStatus === "pending",
    );
    const sumGross = (rows: InstallmentCheck[]) =>
      rows.reduce((sum, c) => sum + Number(c.installmentCheckGrossAmount || 0), 0);

    return {
      depositedCount: deposited.length,
      depositedTotal: sumGross(deposited),
      pendingCount: pending.length,
      pendingTotal: sumGross(pending),
    };
  }, [installment?.checks]);

  const [depositTarget, setDepositTarget] = useState<InstallmentCheck | null>(
    null,
  );
  const [depositDate, setDepositDate] = useState(todayStr());
  const [isConfirmingDeposit, setIsConfirmingDeposit] = useState(false);

  const handleStatusChange = async (
    check: InstallmentCheck,
    installmentCheckStatus: string,
    installmentCheckDepositedDate?: string,
  ) => {
    if (!storeId) return;

    try {
      const res = await fetch(
        `/api/installments/${storeId}/checks/${check.installmentCheckId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            installmentCheckStatus,
            ...(installmentCheckDepositedDate
              ? { installmentCheckDepositedDate }
              : {}),
          }),
        },
      );
      const json = await res.json();

      if (!json.success) {
        toast.error(json.message || "Failed to update check");
        return;
      }

      toast.success("Check updated!");
      mutate();
    } catch (e: any) {
      toast.error(e?.message || "Failed to update check");
    }
  };

  const handleConfirmDeposit = async () => {
    if (!depositTarget) return;

    setIsConfirmingDeposit(true);
    await handleStatusChange(depositTarget, "deposited", depositDate);
    setIsConfirmingDeposit(false);
    setDepositTarget(null);
  };

  const handleCancelDeposit = () => {
    setDepositTarget(null);
  };

  const columns: Column<InstallmentCheck>[] = [
    { key: "installmentCheckSequenceNo", name: "#" },
    {
      key: "installmentCheckDate",
      name: "Check Date",
      selector: (row) => row.installmentCheckDate?.slice(0, 10),
    },
    {
      key: "installmentCheckNo",
      name: "Check No.",
      selector: (row) => row.installmentCheckNo || "—",
    },
    {
      key: "installmentCheckGrossAmount",
      name: "Gross Amount",
      selector: (row) => formatPeso(row.installmentCheckGrossAmount),
    },
    {
      key: "installmentCheckEwtWithheld",
      name: "EWT Withheld",
      selector: (row) => formatPeso(row.installmentCheckEwtWithheld),
    },
    {
      key: "installmentCheckNetAmount",
      name: "Net Amount",
      selector: (row) => formatPeso(row.installmentCheckNetAmount),
    },
    {
      key: "installmentCheckDepositedDate",
      name: "Deposited On",
      selector: (row) =>
        row.installmentCheckDepositedDate ? (
          <div className="flex flex-col">
            <span>{row.installmentCheckDepositedDate.slice(0, 10)}</span>
            {row.installmentCheckDepositedByName && (
              <span className="text-[10px] text-gray-400">
                {row.installmentCheckDepositedByName}
              </span>
            )}
          </div>
        ) : (
          "—"
        ),
    },
    {
      key: "installmentCheckStatus",
      name: "Status",
      selector: (row) => (
        <span
          className={`inline-block rounded-full px-2 py-1 text-[10px] font-medium capitalize ${
            statusStyles[row.installmentCheckStatus] ?? "bg-gray-100 text-gray-500"
          }`}
        >
          {row.installmentCheckStatus}
        </span>
      ),
    },
  ];

  return (
    <PageLayout className="p-2 gap-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/installments")}
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <PageHeader
          title={installment?.installmentNo ?? "Installment Plan"}
          subtitle={installment?.installmentDescription}
        />
      </div>

      {isLoading || !installment ? (
        <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
          {isLoading ? "Loading..." : "Installment plan not found."}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-gray-100 bg-white p-4 text-xs md:grid-cols-4">
            <div>
              <p className="text-gray-400">Client</p>
              <p className="font-semibold text-gray-800">
                {installment.customerName}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Client Code</p>
              <p className="font-semibold text-gray-800">
                {installment.installmentClientCode}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Total Amount</p>
              <p className="font-semibold text-gray-800">
                {formatPeso(installment.installmentTotalAmount)}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Status</p>
              <span
                className={`inline-block rounded-full px-2 py-1 text-[10px] font-medium capitalize ${
                  statusStyles[installment.installmentStatus] ??
                  "bg-gray-100 text-gray-500"
                }`}
              >
                {installment.installmentStatus}
              </span>
            </div>
            <div>
              <p className="text-gray-400">Checks Deposited</p>
              <p className="font-semibold text-emerald-600">
                {summary.depositedCount}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Total Deposited</p>
              <p className="font-semibold text-emerald-600">
                {formatPeso(summary.depositedTotal)}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Checks Pending</p>
              <p className="font-semibold text-amber-600">
                {summary.pendingCount}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Amount Pending</p>
              <p className="font-semibold text-amber-600">
                {formatPeso(summary.pendingTotal)}
              </p>
            </div>
          </div>

          <div className="min-h-0 flex-1 flex flex-col">
            <Table
              columns={columns}
              data={installment.checks}
              uniqueIdKey="installmentCheckId"
              maxHeight="h-full"
              showActions
              renderActions={(row) => (
                <CheckActionsMenu
                  onDeposit={() => {
                    setDepositDate(todayStr());
                    setDepositTarget(row);
                  }}
                  onVoid={() => handleStatusChange(row, "bounced")}
                  onCancel={() => handleStatusChange(row, "cancelled")}
                />
              )}
            />
          </div>
        </>
      )}

      <Modal
        isOpen={!!depositTarget}
        onClose={handleCancelDeposit}
        title="Confirm Deposit"
        size="sm"
      >
        {depositTarget && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-600">
              Mark check{" "}
              <span className="font-semibold text-gray-900">
                #{depositTarget.installmentCheckSequenceNo}
                {depositTarget.installmentCheckNo
                  ? ` (${depositTarget.installmentCheckNo})`
                  : ""}
              </span>{" "}
              as deposited.
            </p>

            <Input
              label="Deposit Date"
              sizes="sm"
              type="date"
              value={depositDate}
              onChange={(e) => setDepositDate(e.target.value)}
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button
                label="Cancel"
                size="sm"
                color="secondary"
                onClick={handleCancelDeposit}
                disabled={isConfirmingDeposit}
              />
              <Button
                label="Confirm Deposit"
                size="sm"
                onClick={handleConfirmDeposit}
                loading={isConfirmingDeposit}
              />
            </div>
          </div>
        )}
      </Modal>
    </PageLayout>
  );
};

export default InstallmentDetailPage;
