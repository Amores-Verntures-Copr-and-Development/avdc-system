import {
  LoyverseIntegrationInterface,
  MerchantInteface,
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

interface MerchantPageProps {
  data: LoyverseIntegrationInterface;
  storeId: number;
  mutate: () => void;
}

const MerchantPage = ({ data, storeId, mutate }: MerchantPageProps) => {
  const [selectedMerchantId, setSelectedMerchantId] = useState<string>("");
  const [isConnecting, setIsConneting] = useState(false);
  const { data: responseMerchant, isLoading: isLoadingMerchant } = useSWR<
    ApiResponse<MerchantInteface[]>
  >(`/api/integration/${storeId}/${data.integId}/loyverse/merchant`, fetcher);

  const merchants = responseMerchant?.data ?? [];

  const handleConnect = async () => {
    setIsConneting(true);
    if (!selectedMerchantId) {
      toast.error("No selected merchant to connet!");
      return;
    }

    console.log("Selected merchant:", selectedMerchantId);
    try {
      const res = await fetch(
        `/api/integration/${storeId}/${data.integId}/loyverse/merchant`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ merchantId: selectedMerchantId }),
        },
      );
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.message || "Failed to connect merchant to store!");
      }
      mutate();
      toast.success("Merchant linked successfully!");
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
          Choose the Loyverse merchant account you want to connect with your
          store.
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {isLoadingMerchant ? (
          <LoaderComponent />
        ) : merchants.length === 0 ? (
          <div className="text-sm text-muted-text">No merchant found.</div>
        ) : (
          merchants.map((m, index) => {
            const isSelected = selectedMerchantId === m.id;

            return (
              <div
                key={index}
                onClick={() => setSelectedMerchantId(m.id)}
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
                    onChange={() => setSelectedMerchantId(m.id)}
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
                      {m.business_name}
                    </h3>

                    <p className="text-xs text-secondary-text">
                      Merchant ID: {m.id}
                    </p>

                    <div className="flex items-center gap-4 mt-1 text-xs text-secondary-text">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {m.country}
                      </span>

                      <span className="flex items-center gap-1">
                        <Globe2 className="w-3 h-3" />
                        {m.currency?.code}
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
      {selectedMerchantId && (
        <div className="flex justify-end">
          <div>
            <Button
              label="Connect Selected Merchant"
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

export default MerchantPage;
