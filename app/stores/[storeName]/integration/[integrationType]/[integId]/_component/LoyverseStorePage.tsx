import {
  LoyverseIntegrationInterface,
  LoyverseStore,
} from "@/types/loyverse-integration";

import { ApiResponse } from "@/types/api";
import { fetcher } from "@/utils/fetcher";
import LoaderComponent from "@/components/shared/LoaderComponent";
import {
  Building2,
  ChevronRight,
  Globe2,
  Info,
  Link,
  Link2,
} from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";
import useSWR from "swr";
import Button from "@/components/shared/Button";
import toast from "react-hot-toast";

interface LoyverseStorePageProps {
  data: LoyverseIntegrationInterface;
  storeId: number;
  mutate: () => void;
}

const LoyverseStorePage = ({
  data,
  storeId,
  mutate,
}: LoyverseStorePageProps) => {
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [isConnecting, setIsConneting] = useState(false);
  const { data: responseStore, isLoading: isLoadingStore } = useSWR<
    ApiResponse<LoyverseStore[]>
  >(`/api/integration/${storeId}/${data.integId}/loyverse/stores`, fetcher);

  const stores = responseStore?.data ?? [];

  const handleConnect = async () => {
    setIsConneting(true);
    if (!selectedStoreId) {
      toast.error("No selected stores to connet!");
      return;
    }

    try {
      const res = await fetch(
        `/api/integration/${storeId}/${data.integId}/loyverse/stores`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storeId: selectedStoreId }),
        },
      );
      const json = await res.json();
      if (!json.success) {
        throw new Error(
          json.message || "Failed to connect loyverse store to your store!",
        );
      }
      mutate();
      toast.success("Loyverse Store linked successfully!");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsConneting(false);
    }
  };

  return (
    <div className="flex flex-col mt-4 p-2 gap-4">
      <div className="bg-blue-300/10 border border-blue-400/50 rounded-sm flex-1 p-2 items-center flex gap-1">
        <Info className="text-blue-500 w-4 h-4" />
        <span className="text-blue-500 text-[11px] font-medium">
          Choose the Loyverse store account you want to connect with your store.
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {isLoadingStore ? (
          <LoaderComponent />
        ) : stores.length === 0 ? (
          <div className="text-sm text-muted-text">No store found.</div>
        ) : (
          stores.map((m, index) => {
            const isSelected = selectedStoreId === m.id;

            return (
              <div
                key={index}
                onClick={() => setSelectedStoreId(m.id)}
                className={`flex items-center justify-between rounded-md border border-card bg-white p-4 cursor-pointer transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <div className="flex items-center gap-4">
                  <input
                    type="radio"
                    checked={isSelected}
                    onChange={() => setSelectedStoreId(m.id)}
                    className="accent-primary"
                  />

                  <Image
                    src="/loyverse.png"
                    alt="Loyverse"
                    width={64}
                    height={64}
                    className="rounded-md object-cover"
                  />

                  <div className="flex flex-col">
                    <h3 className="text-sm font-semibold text-primary-text">
                      {m.name}
                    </h3>

                    <p className="text-xs text-secondary-text">
                      Store ID: {m.id}
                    </p>

                    <div className="flex items-center gap-4 mt-1 text-xs text-secondary-text">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {m.address}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="px-3 py-1 rounded-full bg-green-100 text-green-600 text-xs font-medium">
                    Active
                  </span>

                  <ChevronRight className="w-4 h-4 text-muted-text" />
                </div>
              </div>
            );
          })
        )}
      </div>
      {selectedStoreId && (
        <div className="flex justify-end">
          <div>
            <Button
              label="Connect Selected Store"
              size="sm"
              isRounded={false}
              icon={Link}
              loading={isConnecting}
              onClick={handleConnect}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default LoyverseStorePage;
