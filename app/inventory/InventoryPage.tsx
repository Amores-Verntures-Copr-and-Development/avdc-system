"use client";
import Button from "@/components/shared/Button";
import PageHeader from "@/components/shared/PageHeader";
import { ArrowLeft, FileChartColumn, Package, Package2 } from "lucide-react";
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
  const [selectionSection, setSelectionSection] = useState<
    "inventory" | "movement" | "report"
  >("inventory");
  const [inventoryId, setInventoryId] = useState(0);
  const [selectedInventory, setSelectedInventory] =
    useState<DisplayAllInventory | null>();
  const { user, hasStore } = useSession();
  console.log({ hasStore });
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
      user?.empPosition === "staff" ||
      user?.empPosition === "admin"
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
    <PageLayout className="gap-2 p-2 ">
      {user?.empPosition === "purchaser" ||
      user?.empPosition === "supervisor" ||
      user?.empPosition === "staff" ||
      user?.empPosition === "admin" ? (
        <>
          <div className="flex justify-between items-center">
            <PageHeader
              title={"Inventory"}
              subtitle="Track and manage your stock levels"
            />
            <div className="flex">
              <div className="flex  border-gray-300">
                <div>
                  <Button
                    isRounded={false}
                    size="sm"
                    onClick={function (): void {
                      setSelectionSection("inventory");
                    }}
                    color={
                      selectionSection === "inventory" ? "primary" : "nocolor"
                    }
                    label="Inventory"
                    icon={<Package className="h-3 w-3 md:w-5 md:h-5" />}
                  />
                </div>
                <div>
                  <Button
                    isRounded={false}
                    size="sm"
                    onClick={function (): void {
                      setSelectionSection("movement");
                    }}
                    color={
                      selectionSection === "movement" ? "primary" : "nocolor"
                    }
                    label="Stock Movement"
                    icon={<Package2 className="h-3 w-3 md:w-5 md:h-5" />}
                  />
                </div>
                <div>
                  <Button
                    isRounded={false}
                    size="sm"
                    onClick={function (): void {
                      setSelectionSection("report");
                    }}
                    color={
                      selectionSection === "report" ? "primary" : "nocolor"
                    }
                    label="Report"
                    icon={<FileChartColumn className="h-3 w-3 md:w-5 md:h-5" />}
                  />
                </div>
              </div>
            </div>
          </div>

          <InventoryView
            inventoryId={inventoryId}
            user={user}
            view={selectionSection}
          />
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
                view={selectionSection}
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
