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
  extends InventoryInterface, StoreInterface, StockRoom {}
const InventoryPage = () => {
  const [selectionSection, setSelectionSection] = useState<
    "inventory" | "movement" | "report"
  >("inventory");
  const [inventoryId, setInventoryId] = useState(0);
  const [selectedInventory, setSelectedInventory] =
    useState<DisplayAllInventory | null>();
  const { user, hasStore, loading: isUseLoading } = useSession();

  const {
    data: stockRoomResponse = { data: [] },
    isLoading: isStockRoomLoading,
  } = useSWR<{
    data: StockRoom[];
  }>(
    !["supervisor", "staff"].includes(user?.empPosition ?? "") && !hasStore
      ? `/api/stock-room/userId/${user?.userId}`
      : null,
    fetcher,
  );

  const stockRoomId = stockRoomResponse.data[0]?.stockRoomId
    ? stockRoomResponse.data[0]?.stockRoomId
    : null;

  const inventoryBaseUrl = hasStore
    ? `/api/inventory/store/${user?.storeId}`
    : stockRoomId
      ? `/api/inventory/stock-room/${user?.userId}`
      : `/api/inventory`;

  const { data: inventoryResponse = { data: [] } } = useSWR<{
    data: DisplayAllInventory[];
  }>(user ? inventoryBaseUrl : null, fetcher);
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
        inventoryResponse.data.length > 0 &&
        !isStockRoomLoading &&
        !isUseLoading
      ) {
        setInventoryId(inventoryResponse.data[0].inventoryId);
      }
    }
  }, [inventoryResponse, user?.empPosition]);

  // Also add this to see when inventoryId changes

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
                      selectionSection === "inventory" ? "primary" : "secondary"
                    }
                    label="Inventory"
                    icon={Package}
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
                      selectionSection === "movement" ? "primary" : "secondary"
                    }
                    label="Stock Movement"
                    icon={Package2}
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
                      selectionSection === "report" ? "primary" : "secondary"
                    }
                    label="Report"
                    icon={FileChartColumn}
                  />
                </div>
              </div>
            </div>
          </div>

          <InventoryView
            inventoryId={inventoryId}
            user={user}
            view={selectionSection}
            inventoryType={
              hasStore ? "stores" : stockRoomId ? "stock-room" : "inventoryId"
            }
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
                    icon={ArrowLeft}
                    onClick={() => {
                      setSelectedInventory(null);
                      console.log("Clicked");
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <div className="flex  border-gray-300">
                  <div>
                    <Button
                      isRounded={false}
                      size="sm"
                      onClick={function (): void {
                        setSelectionSection("inventory");
                      }}
                      color={
                        selectionSection === "inventory"
                          ? "primary"
                          : "secondary"
                      }
                      label="Inventory"
                      icon={Package}
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
                        selectionSection === "movement"
                          ? "primary"
                          : "secondary"
                      }
                      label="Stock Movement"
                      icon={Package2}
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
                        selectionSection === "report" ? "primary" : "secondary"
                      }
                      label="Report"
                      icon={FileChartColumn}
                    />
                  </div>
                </div>
              </div>
              <InventoryView
                inventoryId={selectedInventory.inventoryId}
                user={user}
                view={selectionSection}
                inventoryType={
                  hasStore
                    ? "stores"
                    : stockRoomId
                      ? "stock-room"
                      : "inventoryId"
                }
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
