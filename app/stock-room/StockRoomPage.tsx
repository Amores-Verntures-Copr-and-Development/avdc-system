"use client";

import PageHeader from "@/components/shared/PageHeader";
import PageLayout from "@/components/shared/PageLayout";
import React, { useEffect, useMemo, useState } from "react";
import StockRoomCard from "./component/StockRoomCard";
import Button from "@/components/shared/Button";
import {
  ArrowLeft,
  FileChartColumn,
  Package,
  Package2,
  Plus,
} from "lucide-react";
import Modal from "@/components/shared/Modal";
import AddStockRoomModal from "./component/AddStockRoomModal";
import toast from "react-hot-toast";
import { CreateStockRoom } from "@/dtos/stockRoom.dto";
import { useSession } from "@/hooks/useSession";
import useSWR from "swr";
import { StockRoom, StockRoomUsers } from "@/types/stockRoom";
import { fetcher } from "@/utils/fetcher";
import StockInventoryView from "./view/StockInventoryView";
import StockPurchaserView from "./view/StockPurchaserView";
import StockStoresView from "./view/StockUserView";
import { useRouter } from "next/navigation";
import LoaderComponent from "@/components/shared/LoaderComponent";

const RESTRICTED_POSITIONS = ["supervisor", "staff", "purchaser"];

const StockRoomPage = () => {
  const router = useRouter();
  const { user } = useSession();
  const [showAdd, setShowAdd] = useState(false);
  const [viewSelection, setViewSelection] = useState<
    "inventory" | "purchaser" | "stores"
  >("inventory");
  const [selectedStockRoom, setSelectedStockRoom] = useState<StockRoom | null>(
    null,
  );
  const {
    data: response = { data: [] },
    mutate,
    isLoading,
  } = useSWR<{
    data: (StockRoom & { totalItems?: number })[];
  }>("/api/stock-room/", fetcher);

  const isRestrictedEmployee =
    user?.userRole === "employee" &&
    RESTRICTED_POSITIONS.includes(user?.empPosition ?? "");

  const { data: assignedResponse } = useSWR<{ data: StockRoomUsers[] }>(
    isRestrictedEmployee && user?.userId
      ? `/api/stock-room/userId/${user.userId}/user`
      : null,
    fetcher,
  );

  const assignedStockRoomIds = useMemo(
    () => new Set((assignedResponse?.data ?? []).map((r) => r.stockRoomId)),
    [assignedResponse],
  );

  const visibleStockRooms = isRestrictedEmployee
    ? response.data.filter((s) => assignedStockRoomIds.has(s.stockRoomId))
    : response.data;

  const isWaitingForAssignment = isRestrictedEmployee && !assignedResponse;

  useEffect(() => {
    if (!isRestrictedEmployee || !assignedResponse) return;

    if (visibleStockRooms.length === 1) {
      router.replace(`/stock-room/${visibleStockRooms[0].stockRoomId}`);
    }
  }, [isRestrictedEmployee, assignedResponse, visibleStockRooms, isLoading]);

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
      mutate();
      return true;
    } catch (e) {
      console.log(e);
      toast.error("Failed to add user.");
      return false;
    }
  };
  if (isLoading) return <LoaderComponent />;
  if (isWaitingForAssignment) return <LoaderComponent />;

  return (
    <PageLayout className="p-2 gap-2">
      <div className="flex justify-between align-middle items-center">
        <PageHeader title={"Stock Room"} subtitle="View stock room" />
        {!isRestrictedEmployee && (
          <div className="">
            <div>
              <Button
                size="sm"
                label="Create Stock Room"
                icon={Plus}
                onClick={() => {
                  setShowAdd(true);
                }}
              />
            </div>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {visibleStockRooms.map((stock) => (
          <StockRoomCard
            key={stock.stockRoomId}
            data={stock}
            onClick={(row) => router.push(`/stock-room/${row.stockRoomId}`)}
          />
        ))}
      </div>

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
