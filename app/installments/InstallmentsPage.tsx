"use client";

import DropdownSelect from "@/components/shared/DropdownSelect";
import Modal from "@/components/shared/Modal";
import PageHeader from "@/components/shared/PageHeader";
import PageLayout from "@/components/shared/PageLayout";
import StatCard from "@/components/shared/StatCard";
import Table, { Column } from "@/components/shared/Table";
import { useSession } from "@/hooks/useSession";
import { useStores } from "@/hooks/userStore";
import { ApiResponse } from "@/types/api";
import { DisplayInstallment, InstallmentSummary } from "@/types/installments";
import { StoreInterface } from "@/types/stores";
import { fetcher } from "@/utils/fetcher";
import { formatPeso } from "@/utils/formatPeso";
import { CalendarClock, CheckCircle2, FileText, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import CreateInstallmentModal from "./components/CreateInstallmentModal";

const statusStyles: Record<string, string> = {
  active: "bg-blue-50 text-blue-600",
  completed: "bg-emerald-50 text-emerald-600",
  cancelled: "bg-gray-100 text-gray-500",
  defaulted: "bg-rose-50 text-rose-600",
};

const InstallmentsPage = () => {
  const router = useRouter();
  const { user, loading, isAdmin, hasStore } = useSession();
  const { stores } = useStores({ user, hasStore, isAdmin });
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const storeOptions = useMemo(() => {
    const list = Array.isArray(stores) ? stores : stores ? [stores] : [];
    return list.filter(
      (s): s is StoreInterface & { storeId: number } =>
        !!s.storeId && !!s.storeInstallmentEnabled,
    );
  }, [stores]);

  useEffect(() => {
    if (user?.storeId) {
      setSelectedStoreId(user.storeId);
      return;
    }
    if (!selectedStoreId && storeOptions.length > 0) {
      setSelectedStoreId(storeOptions[0].storeId);
    }
  }, [user?.storeId, storeOptions, selectedStoreId]);

  const {
    data: response,
    isLoading,
    mutate,
  } = useSWR<ApiResponse<DisplayInstallment[]>>(
    selectedStoreId ? `/api/installments/${selectedStoreId}` : null,
    fetcher,
  );

  const installments = response?.data ?? [];

  const { data: summaryResponse, mutate: mutateSummary } = useSWR<
    ApiResponse<InstallmentSummary>
  >(
    selectedStoreId ? `/api/installments/${selectedStoreId}/summary` : null,
    fetcher,
  );
  const summary = summaryResponse?.data;

  const columns: Column<DisplayInstallment>[] = [
    { key: "installmentNo", name: "Plan No." },
    { key: "customerName", name: "Client" },
    { key: "installmentClientCode", name: "Client Code" },
    { key: "installmentDescription", name: "Description" },
    {
      key: "installmentTotalAmount",
      name: "Total Amount",
      selector: (row) => formatPeso(row.installmentTotalAmount),
    },
    {
      key: "depositedAmount",
      name: "Deposited",
      selector: (row) => (
        <span className="text-emerald-600">
          {formatPeso(row.depositedAmount)}
        </span>
      ),
    },
    {
      key: "pendingAmount",
      name: "Pending",
      selector: (row) => (
        <span className="text-amber-600">{formatPeso(row.pendingAmount)}</span>
      ),
    },
    {
      key: "checks",
      name: "Checks Deposited",
      selector: (row) => `${row.depositedChecks ?? 0} / ${row.totalChecks ?? 0}`,
    },
    {
      key: "installmentStatus",
      name: "Status",
      selector: (row) => (
        <span
          className={`rounded-full px-2 py-1 text-[10px] font-medium capitalize ${
            statusStyles[row.installmentStatus] ?? "bg-gray-100 text-gray-500"
          }`}
        >
          {row.installmentStatus}
        </span>
      ),
    },
  ];

  if (loading) return null;

  return (
    <PageLayout className="p-2 gap-3">
      <div className="flex items-start justify-between gap-3">
        <PageHeader
          title="Installments"
          subtitle="Track installment plans and scheduled check deposits."
        />

        {!user?.storeId && storeOptions.length > 0 && (
          <div className="w-56">
            <DropdownSelect
              name="storeId"
              sizes="sm"
              value={selectedStoreId ? String(selectedStoreId) : undefined}
              options={storeOptions.map((s) => ({
                label: s.storeName,
                value: s.storeId,
              }))}
              onChange={(e) => setSelectedStoreId(Number(e.target.value))}
            />
          </div>
        )}
      </div>

      {!selectedStoreId ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center text-sm text-gray-400">
          No store with the Installment feature enabled.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard
              icon={FileText}
              title="Active Plans"
              value={`${summary?.activePlans ?? 0} / ${summary?.totalPlans ?? 0}`}
              subtitle="Currently active installment plans"
            />
            <StatCard
              icon={Wallet}
              title="Total Portfolio"
              value={formatPeso(summary?.totalPortfolio ?? 0)}
              subtitle="Combined value of all plans"
              textColor="text-indigo-600"
              bgColor="bg-indigo-50"
            />
            <StatCard
              icon={CheckCircle2}
              title="Total Collected"
              value={formatPeso(summary?.totalCollected ?? 0)}
              subtitle={`${formatPeso(summary?.totalOutstanding ?? 0)} still outstanding`}
              textColor="text-emerald-600"
              bgColor="bg-emerald-50"
            />
            <StatCard
              icon={CalendarClock}
              title="Checks Due Today"
              value={summary?.checksDueToday ?? 0}
              subtitle="Pending checks scheduled for today"
              textColor="text-amber-600"
              bgColor="bg-amber-50"
            />
          </div>

          <div className="min-h-0 flex-1 flex flex-col">
            <Table
              columns={columns}
              data={installments}
              loading={isLoading}
              maxHeight="h-full"
              onRowSelection={(row) =>
                router.push(`/installments/${row.installmentId}?storeId=${row.storeId}`)
              }
              renderTopActionButtons={[
                {
                  props: {
                    label: "New Installment",
                    onClick: () => setShowCreateModal(true),
                  },
                },
              ]}
            />
          </div>
        </>
      )}

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="New Installment Plan"
        size="xl"
      >
        {selectedStoreId && (
          <CreateInstallmentModal
            storeId={selectedStoreId}
            onCancel={() => setShowCreateModal(false)}
            onCreated={() => {
              setShowCreateModal(false);
              mutate();
              mutateSummary();
            }}
          />
        )}
      </Modal>
    </PageLayout>
  );
};

export default InstallmentsPage;
