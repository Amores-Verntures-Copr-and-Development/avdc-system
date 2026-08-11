"use client";

import Button from "@/components/shared/Button";
import ConfirmationModal from "@/components/shared/ConfirmationModal";
import Input from "@/components/shared/Input";
import LoaderComponent from "@/components/shared/LoaderComponent";
import Toggle from "@/components/shared/Toggle";
import { DisplayExternalDashboardAccess } from "@/types/externalDashboardAccess";
import { formatDateToWords } from "@/utils/formatDateToWords";
import { Copy } from "lucide-react";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface StoreOption {
  storeId: number;
  storeName: string;
}

interface ExternalDashboardAccessModalProps {
  userId: number;
  userName: string;
  stores: StoreOption[];
  onClose: () => void;
}

const ExternalDashboardAccessModal = ({
  userId,
  userName,
  stores,
  onClose,
}: ExternalDashboardAccessModalProps) => {
  const [loading, setLoading] = useState(true);
  const [access, setAccess] = useState<DisplayExternalDashboardAccess | null>(
    null,
  );
  const [enabled, setEnabled] = useState(false);
  const [isAllStores, setIsAllStores] = useState(true);
  const [selectedStoreIds, setSelectedStoreIds] = useState<number[]>([]);
  const [rawToken, setRawToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/users/${userId}/external-dashboard-access`,
        );
        const json = await res.json();
        const data: DisplayExternalDashboardAccess | null = json.data ?? null;

        setAccess(data);
        setEnabled(data?.edaStatus === "active");
        setIsAllStores(data ? Boolean(data.edaIsAllStores) : true);
        setSelectedStoreIds(data?.storeIds ?? []);
      } catch {
        toast.error("Failed to load external dashboard access");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userId]);

  const toggleStore = (storeId: number) => {
    setSelectedStoreIds((prev) =>
      prev.includes(storeId)
        ? prev.filter((id) => id !== storeId)
        : [...prev, storeId],
    );
  };

  const handleSave = async () => {
    // Toggled off with an existing active grant - this is a revoke, which
    // is destructive (their token stops working immediately), so route it
    // through a confirmation instead of silently reconciling on Save.
    if (!enabled) {
      if (access?.edaStatus === "active") {
        setShowRevokeConfirm(true);
      } else {
        onClose();
      }
      return;
    }

    if (!isAllStores && selectedStoreIds.length === 0) {
      toast.error("Select at least one store, or enable All Stores!");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(
        `/api/users/${userId}/external-dashboard-access`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            edaIsAllStores: isAllStores,
            storeIds: isAllStores ? [] : selectedStoreIds,
          }),
        },
      );
      const json = await res.json();

      if (!json.success) {
        toast.error(json.message || "Failed to save");
        return;
      }

      setAccess(json.data.access);
      if (json.data.rawToken) {
        setRawToken(json.data.rawToken);
      }
      toast.success(json.message || "Saved!");
    } catch (e: any) {
      toast.error(e?.message || "Failed to save");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(
        `/api/users/${userId}/external-dashboard-access`,
        { method: "DELETE" },
      );
      const json = await res.json();

      if (!json.success) {
        toast.error(json.message || "Failed to revoke access");
        return;
      }

      setAccess(json.data);
      setEnabled(false);
      setRawToken(null);
      toast.success("Access revoked!");
    } catch (e: any) {
      toast.error(e?.message || "Failed to revoke access");
    } finally {
      setIsSubmitting(false);
      setShowRevokeConfirm(false);
    }
  };

  const handleRegenerate = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(
        `/api/users/${userId}/external-dashboard-access/regenerate-token`,
        { method: "POST" },
      );
      const json = await res.json();

      if (!json.success) {
        toast.error(json.message || "Failed to regenerate token");
        return;
      }

      setRawToken(json.data.rawToken);
      toast.success("Token regenerated - copy it now!");
    } catch (e: any) {
      toast.error(e?.message || "Failed to regenerate token");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <LoaderComponent />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between rounded-md border border-gray-200 p-3">
        <div>
          <p className="text-sm font-semibold text-gray-800">
            External Dashboard Access
          </p>
          <p className="text-xs text-gray-500">
            Lets {userName} view sales data in the external avdc-track
            dashboard.
          </p>
        </div>
        <Toggle sizes="sm" initial={enabled} onToggle={setEnabled} />
      </div>

      {access && (
        <div className="flex flex-col gap-1 text-xs text-gray-500">
          <span>
            Status:{" "}
            <span
              className={
                access.edaStatus === "active"
                  ? "font-semibold text-emerald-600"
                  : "font-semibold text-rose-500"
              }
            >
              {access.edaStatus}
            </span>
          </span>
          {access.edaLastAccessedAt && (
            <span>
              Last accessed:{" "}
              {formatDateToWords(access.edaLastAccessedAt, {
                showHour: true,
                showMinute: true,
              })}
            </span>
          )}
        </div>
      )}

      {enabled && (
        <div className="flex flex-col gap-3 rounded-md border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-700">
              Which stores can they see?
            </p>
            <Toggle
              label="All Stores"
              sizes="sm"
              initial={isAllStores}
              onToggle={setIsAllStores}
            />
          </div>

          {!isAllStores && (
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {stores.map((store) => (
                <label
                  key={store.storeId}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-gray-200 px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 rounded border-gray-300"
                    checked={selectedStoreIds.includes(store.storeId)}
                    onChange={() => toggleStore(store.storeId)}
                  />
                  {store.storeName}
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {rawToken && (
        <div className="flex flex-col gap-2 rounded-md border border-amber-300 bg-amber-50 p-3">
          <p className="text-xs font-semibold text-amber-700">
            Copy this token now - it won&apos;t be shown again.
          </p>
          <div className="flex gap-2">
            <Input label="" sizes="xs" value={rawToken} readOnly />
            <Button
              icon={Copy}
              label=""
              size="sm"
              color="secondary"
              className="w-auto shrink-0"
              onClick={() => {
                navigator.clipboard.writeText(rawToken);
                toast.success("Copied!");
              }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <div>
          {access?.edaStatus === "active" && (
            <Button
              label="Regenerate Token"
              size="xs"
              color="secondary"
              hasBorder
              onClick={handleRegenerate}
              disabled={isSubmitting}
            />
          )}
        </div>
        <div className="flex gap-2">
          <Button
            label="Close"
            size="xs"
            color="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          />
          <Button
            label="Save"
            size="xs"
            color="primary"
            hasBorder
            onClick={handleSave}
            loading={isSubmitting}
          />
        </div>
      </div>

      <ConfirmationModal
        title="Revoke External Dashboard Access"
        confirmationInfo={`Revoke external dashboard access for ${userName}? Their token will stop working immediately.`}
        confirmLabel="Revoke"
        isShow={showRevokeConfirm}
        isLoading={isSubmitting}
        onConfirm={handleRevoke}
        onClose={() => setShowRevokeConfirm(false)}
      />
    </div>
  );
};

export default ExternalDashboardAccessModal;
