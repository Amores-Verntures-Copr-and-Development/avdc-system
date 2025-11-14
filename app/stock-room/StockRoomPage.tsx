"use client";

import PageHeader from "@/components/shared/PageHeader";
import PageLayout from "@/components/shared/PageLayout";
import React, { useState } from "react";
import StockRoomCard from "./component/StockRoomCard";
import Button from "@/components/shared/Button";
import { FileChartColumn, Package, Package2, Plus } from "lucide-react";
import Modal from "@/components/shared/Modal";
import AddStockRoomModal from "./component/AddStockRoomModal";
import toast from "react-hot-toast";
import { CreateStockRoom } from "@/dtos/stockRoom.dto";
import { useSession } from "@/hooks/useSession";
import useSWR from "swr";
import { StockRoom } from "@/types/stockRoom";
import { fetcher } from "@/utils/fetcher";
import Link from "next/link";
import StockInventoryView from "./view/StockInventoryView";
import StockPurchaserView from "./view/StockPurchaserView";
import StockStoresView from "./view/StockStoresView";

const StockRoomPage = () => {
  const { user } = useSession();
  const [showAdd, setShowAdd] = useState(false);
  const [viewSelection, setViewSelection] = useState<
    "inventory" | "purchaser" | "stores"
  >("inventory");
  const [selectedStockRoom, setSelectedStockRoom] = useState<StockRoom | null>(
    null
  );
  const {
    data: response = { data: [] },
    isLoading,
    mutate,
  } = useSWR<{ data: StockRoom[] }>("/api/stock-room/", fetcher);
  const handleSubmitCreate = async (data: CreateStockRoom) => {
    const newData: CreateStockRoom = {
      ...data,
      stockRoomCreatedBy: user?.userId ?? 0,
    };
    try {
      const result = await fetch("api/stock-room", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newData),
      });
      const res = await result.json();
      if (!res.success) {
        console.log("Res: ", res);
        throw new Error(res.err);
      }
      toast.success(res.message);
      // mutate();
      return true;
    } catch (e) {
      console.log(e);
      toast.error("Failed to add user.");
      return false;
    }
  };
  return (
    <PageLayout className="p-4 gap-2">
      {selectedStockRoom ? (
        <>
          <PageHeader
            title={selectedStockRoom.stockRoomName}
            subtitle={selectedStockRoom.stockRoomLocation}
          />
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
                  color={viewSelection === "inventory" ? "primary" : "nocolor"}
                  className="text-xs font-semibold"
                  icon={<Package size={16} />}
                />
              </div>
              <div>
                <Button
                  onClick={function (): void {
                    setViewSelection("purchaser");
                  }}
                  color={viewSelection === "purchaser" ? "primary" : "nocolor"}
                  isRounded={false}
                  size="sm"
                  label="Purchaser"
                  className="text-xs font-semibold"
                  icon={<Package2 size={16} />}
                />
              </div>
              <div>
                <Button
                  color={viewSelection === "stores" ? "primary" : "nocolor"}
                  onClick={function (): void {
                    setViewSelection("stores");
                  }}
                  isRounded={false}
                  size="sm"
                  label="Store"
                  className="text-xs font-semibold"
                  icon={<FileChartColumn size={16} />}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-1 flex-col bg-white">
            {viewSelection === "inventory" ? (
              <StockInventoryView data={selectedStockRoom} />
            ) : viewSelection === "purchaser" ? (
              <StockPurchaserView data={selectedStockRoom} user={user} />
            ) : (
              <StockStoresView data={selectedStockRoom} user={user} />
            )}
          </div>
        </>
      ) : (
        <>
          <div className="flex justify-between align-middle items-center">
            <PageHeader title={"Stock Room"} subtitle="View stock room" />
            <div>
              <Button
                size="sm"
                label="Create Stock Room"
                icon={<Plus size={20} />}
                onClick={() => {
                  setShowAdd(true);
                }}
              />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {response.data.map((stock) => (
              <StockRoomCard
                key={stock.stockRoomId}
                data={stock}
                onClick={(row) => setSelectedStockRoom(row)}
              />
            ))}
          </div>
        </>
      )}
      <Modal
        title="Create New Stock Room"
        isOpen={showAdd}
        onClose={function (): void {
          setShowAdd(false);
        }}
      >
        <AddStockRoomModal
          onClose={() => {
            setShowAdd(false);
          }}
          onSubmit={handleSubmitCreate}
        />
      </Modal>
    </PageLayout>
  );
};

export default StockRoomPage;
