"use client";

import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import PageHeader from "@/components/shared/PageHeader";
import PageLayout from "@/components/shared/PageLayout";
import { ApiResponse } from "@/types/api";
import { PlatformSettings } from "@/types/platformSettings";
import { fetcher } from "@/utils/fetcher";
import { Save } from "lucide-react";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import useSWR from "swr";

const PlatformSettingsPage = () => {
  const { data: response, mutate } = useSWR<ApiResponse<PlatformSettings>>(
    "/api/platform-settings",
    fetcher,
  );

  const [pricePerStore, setPricePerStore] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (response?.data) {
      setPricePerStore(String(response.data.platformSettingPricePerStore));
    }
  }, [response?.data]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await fetch("/api/platform-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platformSettingPricePerStore: Number(pricePerStore),
        }),
      });
      const res = await result.json();
      if (!res.success) {
        throw new Error(res.message);
      }
      toast.success("Platform settings updated successfully!");
      mutate();
    } catch (e: any) {
      toast.error(e.message || "Failed to update platform settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PageLayout className="p-2 gap-2">
      <PageHeader
        title={"Platform Settings"}
        subtitle="Manage platform-wide billing configuration."
      />
      <div className="flex flex-col gap-5 max-w-sm">
        <Input
          label={"Price per Store (₱ / month)"}
          sizes="sm"
          type="number"
          min={0}
          step="0.01"
          value={pricePerStore}
          onChange={(e) => setPricePerStore(e.target.value)}
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            icon={Save}
            label="Save"
            className="text-sm font-semibold"
            onClick={handleSave}
            loading={isSaving}
            disabled={!pricePerStore.trim()}
          />
        </div>
      </div>
    </PageLayout>
  );
};

export default PlatformSettingsPage;
