"use client";

import Button from "@/components/shared/Button";
import LoaderComponent from "@/components/shared/LoaderComponent";
import PageHeader from "@/components/shared/PageHeader";
import PageLayout from "@/components/shared/PageLayout";
import { ApiResponse } from "@/types/api";
import { StockRoom } from "@/types/stockRoom";
import { fetcher } from "@/utils/fetcher";
import { ArrowLeft, FileChartColumn, Package, Package2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useState } from "react";
import useSWR from "swr";
import StockInventoryView from "../view/StockInventoryView";
import StockPurchaserView from "../view/StockPurchaserView";
import StockStoresView from "../view/StockStoresView";
import { useSession } from "@/hooks/useSession";

const Page = () => {
  const [viewSelection, setViewSelection] = useState<
    "inventory" | "purchaser" | "stores"
  >("inventory");
  const router = useRouter();
  const params = useParams();
  const { user } = useSession();
  const { stockRoomId } = params;
  const {
    data: response,
    mutate,
    isLoading,
  } = useSWR<ApiResponse<StockRoom[]>>(
    stockRoomId ? `/api/stock-room/${stockRoomId}` : null,
    fetcher,
  );
  const stockroom = response?.data[0];
  if (isLoading) return <LoaderComponent />;
  if (!stockroom)
    return (
      <PageLayout>
        <></>
      </PageLayout>
    );
  return (
    <PageLayout className="p-2">
      <div className="flex justify-between items-center">
        <PageHeader
          title={stockroom?.stockRoomName ?? ""}
          subtitle={stockroom?.stockRoomLocation}
        />
        <div>
          <div>
            <Button
              color="secondary"
              size="sm"
              icon={ArrowLeft}
              label="Back"
              onClick={() => {
                router.back();
              }}
            />
          </div>
        </div>
      </div>
      <div className="flex">
        <div className="flex border-1 border-gray-300">
          <div>
            <Button
              isRounded={false}
              size="sm"
              onClick={function (): void {
                setViewSelection("inventory");
              }}
              label="Inventory"
              color={viewSelection === "inventory" ? "primary" : "secondary"}
              className="text-xs font-semibold"
              icon={Package}
            />
          </div>
          <div>
            <Button
              onClick={function (): void {
                setViewSelection("purchaser");
              }}
              isRounded={false}
              size="sm"
              label="Purchaser"
              className="text-xs font-semibold"
              icon={Package2}
              color={viewSelection === "purchaser" ? "primary" : "secondary"}
            />
          </div>
          <div>
            <Button
              color={viewSelection === "stores" ? "primary" : "secondary"}
              onClick={function (): void {
                setViewSelection("stores");
              }}
              isRounded={false}
              size="sm"
              label="Store"
              className="text-xs font-semibold"
              icon={FileChartColumn}
            />
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0  flex flex-col bg-white">
        {viewSelection === "inventory" ? (
          <StockInventoryView data={stockroom} />
        ) : viewSelection === "purchaser" ? (
          <StockPurchaserView data={stockroom} user={user} />
        ) : (
          <StockStoresView data={stockroom} user={user} />
        )}
      </div>
    </PageLayout>
  );
};

export default Page;
