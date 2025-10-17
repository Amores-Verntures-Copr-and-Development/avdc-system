"use client";
import Button from "@/components/shared/Button";
import PageHeader from "@/components/shared/PageHeader";
import {
  AlertTriangle,
  Box,
  Eye,
  Package,
  Pencil,
  Plus,
  ShoppingCart,
  Store,
  Trash,
  View,
  ViewIcon,
  XCircle,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import InventoryCard from "./components/InventoryCard";
import Table, { Column } from "@/components/shared/Table";
import { inventoryData } from "@/data/itemData";
import Modal from "@/components/shared/Modal";
import AddItemModal from "./components/AddItemModal";
import Input from "@/components/shared/Input";
import PageLayout from "@/components/shared/PageLayout";
import CreateInventoryModal from "./components/CreateInventoryModal";
import {
  CreateFirstItem,
  CreateInventoryDto,
  CreateInventoryItemDto,
  DisplayInventoryItems,
} from "@/dtos/inventory.dto";
import { useSession } from "@/hooks/useSession";
import toast from "react-hot-toast";
import useSWR from "swr";
import { InventoryInterface } from "@/types/inventory";
import { fetcher } from "@/utils/fetcher";
import AddItemStoreModal from "./components/AddItemStoreModal";
import CreateRequestModal from "./components/CreateRequestModal";
import { CreateRequestFormDto } from "@/dtos/request.dto";
import { getInventoryStatusInfo } from "@/utils/inventoryStatus";
import Popup from "@/components/shared/Popup";
import IconButton from "@/components/shared/IconButton";
import ViewInventoryItem from "./components/ViewInventoryItem";

export interface AddItemToStoreDto {
  storeId: number;
  addedById: number;
  items: DisplayInventoryItems[];
}

export const inventoryItemColumns: Column<DisplayInventoryItems>[] = [
  { name: "ID", key: "inventoryItemId" },
  { name: "Item Name", key: "itemName" },
  {
    name: "Quantity",
    key: "inventoryItemQuantity",
  },
  { name: "Price", key: "itemPrice" },
  { name: "Minimum", key: "inventoryItemMin" },

  { name: "Unit", key: "itemUnit" },
  { name: "Category", key: "categoryName" },
  { name: "Store ID", key: "storeId" },
  {
    name: "Status",
    key: "status",
    selector: (row) => {
      const { status, bgClass, textClass } = getInventoryStatusInfo(
        row.inventoryItemQuantity,
        row.inventoryItemMin
      );

      return (
        <span
          className={`px-2 py-1 rounded-lg font-semibold ${bgClass} ${textClass}`}
        >
          {status}
        </span>
      );
    },
  },
];
export const adminInventoryItemColumns: Column<DisplayInventoryItems>[] = [
  {
    name: "ID",
    key: "inventoryItemId",
    selector: (row) => (
      <span className="text-gray-700 font-medium">{row.inventoryItemId}</span>
    ),
  },
  {
    name: "Item Name",
    key: "itemName",
    selector: (row) => (
      <span className="text-gray-800 font-semibold">{row.itemName}</span>
    ),
  },
  {
    name: "Quantity",
    key: "inventoryItemQuantity",
    selector: (row) => (
      <span
        className={`font-semibold ${
          row.inventoryItemQuantity <= 0
            ? "text-red-600"
            : row.inventoryItemQuantity < row.inventoryItemMin
            ? "text-yellow-600"
            : "text-green-600"
        }`}
      >
        {row.inventoryItemQuantity}
      </span>
    ),
  },
  {
    name: "Price",
    key: "itemPrice",
    selector: (row) => (
      <span className="text-gray-700">
        ₱
        {Number(row.itemPrice || 0).toLocaleString("en-PH", {
          minimumFractionDigits: 2,
        })}
      </span>
    ),
  },
  {
    name: "Minimum",
    key: "inventoryItemMin",
    selector: (row) => (
      <span className="text-gray-600">{row.inventoryItemMin}</span>
    ),
  },
  {
    name: "Unit",
    key: "itemUnit",
    selector: (row) => <span className=" text-gray-600">{row.itemUnit}</span>,
  },
  {
    name: "Category",
    key: "categoryName",
    selector: (row) => (
      <span className="text-gray-700">{row.categoryName || "—"}</span>
    ),
  },
  {
    name: "Status",
    key: "status",
    selector: (row) => {
      const { status, bgClass, textClass } = getInventoryStatusInfo(
        row.inventoryItemQuantity,
        row.inventoryItemMin
      );

      return (
        <span
          className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold ${bgClass} ${textClass}`}
        >
          {status}
        </span>
      );
    },
  },
];

const InventoryPage = () => {
  const [showAddModal, setShowAdddModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInventoryItemModal, setShowInventoryItemModal] = useState(false);
  const [showCreateRequestModal, setShowCreateRequestModal] = useState(false);
  const [inventoryId, setInventoryId] = useState(0);
  const { user, loading: userLoading, hasStore } = useSession();
  const [selectedRows, setSelectedRows] = useState<DisplayInventoryItems[]>();
  const [selectedRow, setSelectedRow] = useState<DisplayInventoryItems>();
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const inventoryBaseUrl = hasStore
    ? `/api/inventory/${user?.storeId}`
    : `/api/inventory`;
  const {
    data: inventoryResponse = { data: [] },
    isLoading,
    mutate: mutateInventory,
  } = useSWR<{ data: InventoryInterface[] }>(inventoryBaseUrl, fetcher);

  useEffect(() => {
    if (
      inventoryResponse &&
      Array.isArray(inventoryResponse.data) &&
      inventoryResponse.data.length > 0
    ) {
      setInventoryId(inventoryResponse.data[0].inventoryId);
    }
  }, [inventoryResponse]);
  console.log("inventoryResponse: ", inventoryResponse);
  const {
    data: itemResponse = { data: [] },
    isLoading: loading,
    mutate,
  } = useSWR<{ data: DisplayInventoryItems[] }>(
    inventoryId ? `/api/inventory/item/${inventoryId}` : null,
    fetcher
  );
  console.log("itemResponse: ", itemResponse.data);
  const handleCreateInventory = async (data: CreateInventoryDto) => {
    console.log("CreateInventoryDto: ", data);
    try {
      const newData: CreateInventoryDto = {
        ...data,
        inventoryCreatedBy: user?.userId,
        storeId: user?.storeId,
      };
      const result = await fetch("api/inventory", {
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
      toast.success("Inventory added successfully!");
      mutateInventory();
      return true;
    } catch (e) {
      toast.error("Failed to add Inventory.");
      return false;
    }
  };

  const handleSelectionChange = (selected: DisplayInventoryItems[]) => {
    console.log("Selected rows:", selected);
    // 👉 Here you can trigger bulk delete, bulk approve, etc.
    if (selected.length > 0) {
      setSelectedRows(selected);
    }
    if (selected.length === 0) {
      setSelectedRows(undefined);
    }
  };
  const handleCreateRequest = async (data: CreateRequestFormDto) => {
    try {
      const result = await fetch(`api/request/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const res = await result.json();
      if (!res.success) {
        console.log("Res: ", res);
        throw new Error(res.err);
      }
      toast.success("Request created successfully!");
      mutateInventory();
      return true;
    } catch (e) {
      toast.error("Failed to add Inventory.");
      return false;
    }
  };
  const handleAddItemsToStore = async (data: AddItemToStoreDto) => {
    try {
      const newData: AddItemToStoreDto = {
        ...data,
        addedById: user?.userId ?? 0,
      };
      const result = await fetch(`api/inventory/${newData.storeId}`, {
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
      toast.success("Inventory added successfully!");
      mutateInventory();
      return true;
    } catch (e) {
      toast.error("Failed to add Inventory.");
      return false;
    }
  };
  const handleAddInventoryItem = async (data: CreateFirstItem) => {
    try {
      const newData: CreateFirstItem = {
        ...data,
        itemAddedBy: user?.userId ?? 0,
        inventoryItemCreatedBy: user?.userId ?? 0,
        inventoryId: inventoryId,
      };
      console.log("CreateFirstItem: ", newData);
      const result = await fetch(`api/inventory/item/${inventoryId}`, {
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
      toast.success("Inventory added successfully!");
      mutate();
      return true;
    } catch (e) {
      toast.error("Failed to add item in inventory.");
      return false;
    }
  };
  return (
    <PageLayout>
      <div className="flex justify-between items-center">
        <PageHeader
          title={"Inventory"}
          subtitle="Track and manage your stock levels"
        />
      </div>

      {/* Cards */}
      <div className="grid grid-cols-4 gap-4">
        <InventoryCard
          title="Total Items"
          value={20}
          icon={<Box className="w-6 h-6 text-blue-500" />}
          iconBg="bg-blue-100"
        />
        <InventoryCard
          title="Low Stock Items"
          value={20}
          icon={<AlertTriangle className="w-6 h-6 text-yellow-500" />}
          iconBg="bg-yellow-100"
        />

        <InventoryCard
          title="Total Items"
          value={20}
          icon={<ShoppingCart className="w-6 h-6 text-green-500" />}
          iconBg="bg-green-100"
        />
        <InventoryCard
          title="Out of stock items"
          value={20}
          icon={<XCircle className="w-6 h-6 text-red-500" />}
          iconBg="bg-red-100"
        />
      </div>

      <div className="flex-1 min-h-0  flex flex-col justify-between">
        <Table
          loading={loading || userLoading}
          searchUrl="/inventory"
          columns={hasStore ? inventoryItemColumns : adminInventoryItemColumns}
          data={itemResponse.data}
          showActions
          maxHeight="h-full"
          rowSize="h-10"
          textSize="xs"
          showCheckBox
          onSelectionChange={handleSelectionChange}
          renderTopActions={
            <>
              <div className="flex gap-4">
                {selectedRows?.length &&
                  selectedRows?.length > 0 &&
                  (user?.empPosition === "supervisor" ||
                    user?.empPosition === "staff") && (
                    <div>
                      <Button
                        icon={<Store size={17} />}
                        label="Request Stock"
                        onClick={() => {
                          setShowCreateRequestModal(true);
                        }}
                        size="sm"
                        className="font-semibold"
                        color="tertiary"
                      />
                    </div>
                  )}
                {selectedRows?.length &&
                  selectedRows?.length > 0 &&
                  user?.empPosition === "purchaser" && (
                    <div className="">
                      <Button
                        icon={<Package size={17} />}
                        label="Add Item to supplier"
                        onClick={() => {
                          setShowAddItemModal(true);
                        }}
                        size="sm"
                        className="font-semibold"
                        color="tertiary"
                      />
                    </div>
                  )}
                {selectedRows?.length &&
                  selectedRows?.length > 0 &&
                  user?.empPosition === "purchaser" && (
                    <div className="">
                      <Button
                        icon={<Store size={17} />}
                        label="Add Item to store"
                        onClick={() => {
                          setShowAddItemModal(true);
                        }}
                        size="sm"
                        className="font-semibold"
                        color="success"
                      />
                    </div>
                  )}
                {inventoryResponse.data && inventoryResponse.data.length > 0 ? (
                  <div>
                    <Button
                      icon={<Plus size={17} />}
                      label="Add Item"
                      onClick={() => {
                        setShowAdddModal(true);
                      }}
                      size="sm"
                      className="font-semibold"
                    />
                  </div>
                ) : (
                  <div>
                    <Button
                      icon={<Plus size={17} />}
                      label="Create Inventory"
                      onClick={() => {
                        setShowCreateModal(true);
                      }}
                      size="sm"
                      className="font-semibold"
                    />
                  </div>
                )}
              </div>
            </>
          }
          renderActions={(row) => (
            <div className="flex gap-2 justify-center">
              <IconButton
                onClick={function (): void {
                  setSelectedRow(row);
                  setShowInventoryItemModal(true);
                }}
                label={"View"}
                bg={"nobg"}
                icon={<Eye size={18} />}
              />
              <IconButton
                onClick={function (): void {
                  setSelectedRow(row);
                }}
                label={"Delete"}
                bg={"red"}
                icon={<Trash size={18} />}
              />
            </div>
          )}
          totalCount={10}
        />
      </div>
      <Modal
        title={hasStore ? "Add Item from warehouse" : "Add Item"}
        subtitle={
          hasStore ? "Select items from warehouse" : "Enter item details below"
        }
        isOpen={showAddModal}
        onClose={() => {
          setShowAdddModal(false);
        }}
        size="lg"
        className="bg-white"
        children={
          <AddItemModal
            user={user}
            onCancel={() => {
              setShowAdddModal(false);
            }}
            onSubmit={handleAddInventoryItem}
          />
        }
      />
      <Modal
        title="Create Inventory"
        subtitle="Register Inventory for your store"
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
        }}
        size="md"
        className="bg-white"
        children={
          <CreateInventoryModal
            onCancel={() => {
              setShowCreateModal(false);
            }}
            onSubmit={handleCreateInventory}
          />
        }
      />
      <Modal
        title="Add Item to store"
        subtitle="Select store to add this item to their inventory"
        isOpen={showAddItemModal}
        onClose={() => {
          setShowAddItemModal(false);
        }}
        size="lg"
        className="bg-white"
        children={
          <AddItemStoreModal
            data={selectedRows ?? []}
            onCancel={() => {
              setShowAddItemModal(false);
            }}
            onSubmit={handleAddItemsToStore}
          />
        }
      />
      <Modal
        title="Create Request"
        subtitle="Request stock for your store"
        isOpen={showCreateRequestModal}
        onClose={() => {
          setShowCreateRequestModal(false);
        }}
        size="lg"
        className="bg-white"
        children={
          <CreateRequestModal
            data={selectedRows ?? []}
            onCancel={() => {
              setShowAddItemModal(false);
            }}
            onSubmit={handleCreateRequest}
            user={user}
          />
        }
      />
      <Popup
        title={selectedRow?.itemName}
        background="transparent"
        isOpen={showInventoryItemModal}
        onClose={function (): void {
          setShowInventoryItemModal(false);
        }}
        children={<ViewInventoryItem data={selectedRow ?? null} />}
      />
    </PageLayout>
  );
};

export default InventoryPage;
