"use client";

import Button from "@/components/shared/Button";
import ConfirmationModal from "@/components/shared/ConfirmationModal";
import DropdownSelect from "@/components/shared/DropdownSelect";
import Input from "@/components/shared/Input";
import Modal from "@/components/shared/Modal";
import PageLayout from "@/components/shared/PageLayout";
import Pagination from "@/components/shared/Pagintation";
import { ApiResponse } from "@/types/api";
import { DisplayVoucher, VoucherStatus } from "@/types/voucher";
import { StoreInterface } from "@/types/stores";
import { fetcher } from "@/utils/fetcher";
import { formatPeso } from "@/utils/formatPeso";
import {
  Search,
  Ticket,
  TicketCheck,
  TicketPercent,
  TicketX,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import React, { useMemo, useState } from "react";
import toast from "react-hot-toast";
import useSWR from "swr";
import CreateVoucherModal from "./components/CreateVoucherModal";
import EditVoucherModal from "./components/EditVoucherModal";
import VoucherCard from "./components/VoucherCard";
import VoucherStatCard from "./components/VoucherStatCard";

const statusOptions = [
  { label: "All Status", value: "all" },
  { label: "Active", value: "active" },
  { label: "Redeemed", value: "redeemed" },
  { label: "Expired", value: "expired" },
  { label: "Void", value: "void" },
];

const VoucherPage = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editTarget, setEditTarget] = useState<DisplayVoucher | null>(null);
  const [voidTarget, setVoidTarget] = useState<DisplayVoucher | null>(null);
  const [isVoiding, setIsVoiding] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<VoucherStatus | "all">(
    "all",
  );

  const { data: storesResponse } = useSWR<ApiResponse<StoreInterface[]>>(
    "/api/stores",
    fetcher,
  );

  const stores = useMemo(() => {
    return (storesResponse?.data ?? [])
      .filter((s): s is StoreInterface & { storeId: number } => !!s.storeId)
      .map((s) => ({ storeId: s.storeId, storeName: s.storeName }));
  }, [storesResponse]);

  const searchParams = useSearchParams();
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.max(1, parseInt(searchParams.get("limit") || "100", 10));

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (statusFilter !== "all") params.append("status", statusFilter);
    params.append("limit", String(limit));
    params.append("page", String(page));

    return `/api/vouchers?${params.toString()}`;
  }, [search, statusFilter, limit, page]);

  const {
    data: response,
    isLoading,
    mutate,
  } = useSWR<ApiResponse<DisplayVoucher[]>>(apiUrl, fetcher);

  const vouchers = response?.data ?? [];

  const stats = useMemo(() => {
    const active = vouchers.filter((v) => v.voucherStatus === "active").length;
    const redeemed = vouchers.filter(
      (v) => v.voucherStatus === "redeemed",
    ).length;
    const totalValueIssued = vouchers
      .filter((v) => v.voucherValueType === "fixed")
      .reduce((sum, v) => sum + Number(v.voucherFixedValue ?? 0), 0);

    return {
      total: response?.count ?? vouchers.length,
      active,
      redeemed,
      totalValueIssued,
    };
  }, [vouchers, response?.count]);

  const handleCreated = () => {
    setShowCreateModal(false);
    mutate();
  };

  const handleUpdated = () => {
    setEditTarget(null);
    mutate();
  };

  const handlePrint = (voucher: DisplayVoucher) => {
    toast(`Printing voucher ${voucher.voucherCode}`);
  };

  const handleVoid = async () => {
    if (!voidTarget) return;

    setIsVoiding(true);
    try {
      const res = await fetch(`/api/vouchers/${voidTarget.voucherId}/void`, {
        method: "POST",
      });
      const json = await res.json();

      if (!json.success) {
        toast.error(json.message || "Failed to void voucher");
        return;
      }

      toast.success(`Voucher ${voidTarget.voucherCode} voided`);
      setVoidTarget(null);
      mutate();
    } catch (e: any) {
      toast.error(e?.message || "Failed to void voucher");
    } finally {
      setIsVoiding(false);
    }
  };

  return (
    <PageLayout className="gap-4 p-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-gray-900 2xl:text-xl">
            Vouchers
          </h1>
          <p className="text-xs text-gray-400">
            Create and manage store vouchers &middot; Track status, usage,
            and redemption
          </p>
        </div>

        <Button
          label="Create Voucher"
          size="sm"
          className="w-auto"
          icon={Ticket}
          onClick={() => setShowCreateModal(true)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <VoucherStatCard
          title="Total Vouchers"
          value={stats.total}
          caption="All vouchers created"
          icon={<Ticket className="h-4 w-4 text-primary-1 2xl:h-5 2xl:w-5" />}
          iconBg="bg-pink-100"
        />
        <VoucherStatCard
          title="Active"
          value={stats.active}
          caption="Currently active"
          icon={
            <TicketCheck className="h-4 w-4 text-green-600 2xl:h-5 2xl:w-5" />
          }
          iconBg="bg-green-100"
        />
        <VoucherStatCard
          title="Redeemed"
          value={stats.redeemed}
          caption="Successfully used"
          icon={
            <TicketPercent className="h-4 w-4 text-blue-600 2xl:h-5 2xl:w-5" />
          }
          iconBg="bg-blue-100"
        />
        <VoucherStatCard
          title="Fixed Value Issued"
          value={formatPeso(stats.totalValueIssued)}
          caption="Total value issued"
          icon={
            <TicketX className="h-4 w-4 text-amber-600 2xl:h-5 2xl:w-5" />
          }
          iconBg="bg-amber-100"
        />
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="w-full md:w-64">
          <Input
            label=""
            sizes="sm"
            placeholder="Search vouchers..."
            leadingIcon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="w-full md:w-48">
          <DropdownSelect
            name="statusFilter"
            value={statusFilter}
            sizes="sm"
            options={statusOptions}
            onChange={(e) =>
              setStatusFilter(e.target.value as VoucherStatus | "all")
            }
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto rounded-2xl">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            Loading...
          </div>
        ) : vouchers.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            No vouchers found
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {vouchers.map((voucher) => (
              <VoucherCard
                key={voucher.voucherId}
                voucher={voucher}
                stores={stores}
                onPrint={handlePrint}
                onVoid={setVoidTarget}
                onEdit={setEditTarget}
              />
            ))}
          </div>
        )}
      </div>

      <Pagination totalItems={response?.count ?? 0} defaultLimit={100} />

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Voucher"
        size="lg"
      >
        <CreateVoucherModal
          stores={stores}
          onCancel={() => setShowCreateModal(false)}
          onCreated={handleCreated}
        />
      </Modal>

      <Modal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit Voucher"
        size="lg"
      >
        {editTarget && (
          <EditVoucherModal
            voucher={editTarget}
            stores={stores}
            onCancel={() => setEditTarget(null)}
            onUpdated={handleUpdated}
          />
        )}
      </Modal>

      <ConfirmationModal
        isShow={!!voidTarget}
        onClose={() => setVoidTarget(null)}
        onConfirm={handleVoid}
        title="Void Voucher"
        confirmLabel="Void"
        isLoading={isVoiding}
        confirmationInfo={`Are you sure you want to void ${voidTarget?.voucherCode}? This cannot be undone.`}
      />
    </PageLayout>
  );
};

export default VoucherPage;
