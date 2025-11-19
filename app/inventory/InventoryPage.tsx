"use client";
import Button from "@/components/shared/Button";
import PageHeader from "@/components/shared/PageHeader";
import { ArrowLeft } from "lucide-react";
import React, { useEffect, useState } from "react";

import PageLayout from "@/components/shared/PageLayout";
import { useSession } from "@/hooks/useSession";
import InventoryDetailsCard from "./components/InventoryDetailsCard";
import InventoryView from "./view/InventoryView";
import { InventoryInterface } from "@/types/inventory";
import { fetcher } from "@/utils/fetcher";
import useSWR from "swr";
import { StoreInterface } from "@/types/stores";
import { StockRoom } from "@/types/stockRoom";

export interface DisplayAllInventory
  extends InventoryInterface,
    StoreInterface,
    StockRoom {}
const InventoryPage = () => {
  const [inventoryId, setInventoryId] = useState(0);
  const [selectedInventory, setSelectedInventory] =
    useState<DisplayAllInventory | null>();
  const { user, hasStore } = useSession();
  console.log({ user });
  const inventoryBaseUrl = hasStore
    ? `/api/inventory/store/${user?.storeId}`
    : user?.userRole === "employee"
    ? `/api/inventory/stock-room/${user?.userId}`
    : `/api/inventory`;

  const { data: inventoryResponse = { data: [] } } = useSWR<{
    data: DisplayAllInventory[];
  }>(inventoryBaseUrl, fetcher);
  useEffect(() => {
    if (
      user?.empPosition === "supervisor" ||
      user?.empPosition === "purchaser" ||
      user?.empPosition === "staff"
    ) {
      if (
        inventoryResponse &&
        Array.isArray(inventoryResponse.data) &&
        inventoryResponse.data.length > 0
      ) {
        setInventoryId(inventoryResponse.data[0].inventoryId);
      }
    }
  }, [inventoryResponse, user?.empPosition]);
  return (
    <PageLayout className="gap-2 p-4">
      {user?.empPosition === "purchaser" ||
      user?.empPosition === "supervisor" ||
      user?.empPosition === "staff" ||
      user?.empPosition === "admin" ? (
        <>
          <PageHeader
            title={"Inventory"}
            subtitle="Track and manage your stock levels"
          />
          <InventoryView inventoryId={inventoryId} user={user} />
        </>
      ) : (
        <>
          {selectedInventory ? (
            <>
              <div className="flex justify-between">
                <PageHeader
                  title={`${
                    selectedInventory.storeName ??
                    selectedInventory.stockRoomName
                  }`}
                  subtitle={`${
                    selectedInventory.inventoryReference === "stock-room"
                      ? "Stock Room"
                      : "Store"
                  }`}
                />
                <div>
                  {" "}
                  <Button
                    label="Back"
                    size="sm"
                    icon={<ArrowLeft size={20} />}
                    onClick={() => {
                      setSelectedInventory(null);
                      console.log("Clicked");
                    }}
                  />
                </div>
              </div>
              <InventoryView
                inventoryId={selectedInventory.inventoryId}
                user={user}
              />
            </>
          ) : (
            <>
              <PageHeader
                title={"Inventory"}
                subtitle="Track and manage stock room and store inventory"
              />
              <div className="grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 overflow-y-auto">
                {inventoryResponse.data.map((inventory) => (
                  <InventoryDetailsCard
                    key={inventory.inventoryId}
                    data={inventory}
                    onClick={(row: DisplayAllInventory) => {
                      setSelectedInventory(row);
                      console.log("Row: ", { row });
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </PageLayout>
  );
};

export default InventoryPage;
