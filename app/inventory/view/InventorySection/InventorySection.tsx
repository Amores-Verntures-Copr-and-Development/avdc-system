import {
  DisplayInventoryItems,
  CreateFirstItem,
  CreateInventoryMovementDto,
} from "@/dtos/inventory.dto";
import { CreateRequestFormDto } from "@/dtos/request.dto";
import { UserAuth, useSession } from "@/hooks/useSession";

import { fetcher } from "@/utils/fetcher";
import React, { useState } from "react";
import toast from "react-hot-toast";
import useSWR from "swr";

import Table, { Column } from "@/components/shared/Table";
import { getInventoryStatusInfo } from "@/utils/inventoryStatus";
import Button from "@/components/shared/Button";
import IconButton from "@/components/shared/IconButton";
import {
  Store,
  Package,
  Plus,
  Eye,
  Trash,
  Clipboard,
  ArrowLeftRight,
  Import,
} from "lucide-react";
import Modal from "@/components/shared/Modal";
import Popup from "@/components/shared/Popup";
import AddItemModal from "../../components/AddItemModal";
import AddItemStoreModal from "../../components/AddItemStoreModal";
import CreateInventoryReport from "../../components/CreateInventoryReport";
import CreateRequestModal from "../../components/CreateRequestModal";
import ViewInventoryItem from "../../components/ViewInventoryItem";
import AddItemSupplierModal from "../../components/AddItemSupplierModal";
import { CreateSupplierItemDto } from "@/dtos/supplier.dto";
import { formatQuantityByUnit } from "@/utils/formatQuantityByUnit";
import { formatPeso } from "@/utils/formatPeso";
import AddItemToProductModal from "../../components/AddItemToProductModal";
import { CreateProductDtos } from "@/dtos/products.dto";
import ImportItemModa from "../../components/ImportItemModal";
import ImportItemModal from "../../components/ImportItemModal";
import { ImportItemDto, ImportItemInfo } from "@/dtos/items.dto";
import { capitalizeWords } from "@/utils/capitalizeWords";

export interface AddItemToStoreDto {
  storeId: number;
  addedById: number;
  items: DisplayInventoryItems[];
}
export const inventoryItemColumns: Column<DisplayInventoryItems>[] = [
  { name: "ID", key: "inventoryItemId" },
  { name: "Item Name", key: "itemName" },
  {
    name: "Stock Available",
    key: "inventoryItemQuantity",
    selector: (row) =>
      formatQuantityByUnit(row.inventoryItemQuantity, row.itemUnit),
  },
  {
    name: "Price",
    key: "itemPrice",
    selector: (row) => formatPeso(row.itemPrice),
  },
  {
    name: "Minimum Stock",
    key: "inventoryItemMin",
  },

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
interface InventorySectionProps {
  inventoryId: number | null;
  user: UserAuth | null;
}
const InventorySection: React.FC<InventorySectionProps> = ({ inventoryId }) => {
  const [showAddModal, setShowAdddModal] = useState(false);
  const [showInventoryItemModal, setShowInventoryItemModal] = useState(false);
  const [showCreateRequestModal, setShowCreateRequestModal] = useState(false);
  const [showCreateReportModal, setShowCreateReportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isSubmittingAdjustment, setIsSubmittingAdjustment] = useState(false);
  const [isSubmittingImport, setIsSubmittingImport] = useState(false);
  const { user, loading: userLoading, hasStore } = useSession();
  const [selectedRows, setSelectedRows] = useState<DisplayInventoryItems[]>();
  const [selectedRow, setSelectedRow] = useState<DisplayInventoryItems>();
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showAddItemSupplierModal, setShowAddItemSupplierModal] =
    useState(false);
  // get the stock inventory if purchaser

  const {
    data: itemResponse = { data: [] },
    isLoading: loading,
    mutate,
  } = useSWR<{ data: DisplayInventoryItems[] }>(
    inventoryId ? `/api/inventory/item/${inventoryId}` : null,
    fetcher
  );

  // const handleCreateInventory = async (data: CreateInventoryDto) => {
  //   console.log("CreateInventoryDto: ", data);
  //   try {
  //     const newData: CreateInventoryDto = {
  //       ...data,
  //       inventoryCreatedBy: user?.userId,
  //       storeId: user?.storeId,
  //     };
  //     const result = await fetch("api/inventory", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify(newData),
  //     });
  //     const res = await result.json();
  //     if (!res.success) {
  //       console.log("Res: ", res);
  //       throw new Error(res.err);
  //     }
  //     toast.success("Inventory added successfully!");
  //     mutate();
  //     return true;
  //   } catch (e) {
  //     console.log(e);
  //     toast.error("Failed to add Inventory.");
  //     return false;
  //   }
  // };

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
      const result = await fetch(`api/requests/`, {
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
      mutate();
      setShowCreateRequestModal(false);
      return true;
    } catch (e) {
      console.log(e);
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
      const result = await fetch(`api/inventory/store/${newData.storeId}`, {
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
      console.log(e);
      toast.error("Failed to add Inventory.");
      return false;
    }
  };
  const handleAddItemsToProduct = async (data: CreateProductDtos[]) => {
    try {
      const newData: CreateProductDtos[] =
        data.map((prod) => ({
          ...prod,
          productCreatedBy: user?.userId ?? 0,
          inventoryId: inventoryId ?? 0,
        })) ?? [];
      console.log("Product: ", newData);
      const result = await fetch(`api/products/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newData),
      });
      const res = await result.json();
      if (!res.success) {
        throw new Error(res.err);
      }
      toast.success("Inventory added successfully!");
      mutate();
      return true;
    } catch (e) {
      console.log(e);
      toast.error("Failed to add Inventory.");
      return false;
    }
  };
  const handleAddItemsToSupplier = async (
    itemData: CreateSupplierItemDto[]
  ) => {
    try {
      if (!user) {
        alert("No user found!");
        return false;
      }
      const newData: CreateSupplierItemDto[] = itemData.map((item) => ({
        ...item,
        suppItemCreatedBy: user?.userId,
      }));
      const result = await fetch(`api/suppliers/supplier-items/`, {
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
        inventoryId: inventoryId ?? 0,
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
      console.log(e);
      toast.error("Failed to add item in inventory.");
      return false;
    }
  };
  const handleSubmitStockAdjustment = async (
    data: CreateInventoryMovementDto
  ) => {
    console.log({ data });
    setIsSubmittingAdjustment(true);
    try {
      const result = await fetch(
        `/api/inventory/movement/${data.inventoryId}/${data.inventoryItemId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );
      const res = await result.json();
      if (!res.success) {
        console.log("Res: ", res);
        throw new Error(res.err);
      }
      mutate();
      toast.success(res.message);
      return true;
    } catch (e) {
      console.log(e);
      return false;
    } finally {
      setIsSubmittingAdjustment(false);
    }
  };
  const handleImportItem = async (data: any[]) => {
    setIsSubmittingImport(true);
    if (!inventoryId) {
      console.log({ inventoryId });
      return false;
    }
    const newData: ImportItemInfo = {
      importedBy: user?.userId ?? 0,
      inventoryId: inventoryId,
      items: data.map((item) => ({
        itemName: capitalizeWords(item.Name),
        categoryName: item.Category,
        itemAddedBy: user?.userId ?? 0,
        itemPrice: item.Price,
        itemUnit: item.Unit,
        itemDescription: item.Description,
      })),
    };
    console.log({ newData });
    try {
      const result = await fetch(`/api/items/import-item/`, {
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
      mutate();
      toast.success(res.message);
      return true;
    } catch (e) {
      console.log(e);
      return false;
    } finally {
      setIsSubmittingImport(false);
    }
  };
  return (
    <>
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
              <div>
                <Button
                  icon={<Clipboard className="w-3 h-3 sm:w-5 sm:h-5" />}
                  label="Inventory Report"
                  onClick={() => {
                    setShowImportModal(true);
                  }}
                  size="xs"
                  className="font-semibold"
                  color="nocolor"
                />
              </div>
              <div>
                <Button
                  icon={<Import className="w-3 h-3 sm:w-5 sm:h-5" />}
                  label="Import Item"
                  onClick={() => {
                    setShowImportModal(true);
                  }}
                  size="xs"
                  className="font-semibold"
                  color="secondary"
                />
              </div>
              {selectedRows?.length &&
                selectedRows?.length > 0 &&
                (user?.empPosition === "supervisor" ||
                  user?.empPosition === "staff") && (
                  <div>
                    <Button
                      icon={<Store className="w-3 h-3 sm:w-5 sm:h-5" />}
                      label="Request Stock"
                      onClick={() => {
                        setShowCreateRequestModal(true);
                      }}
                      size="xs"
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
                      icon={<Package className="w-3 h-3 sm:w-5 sm:h-5" />}
                      label="Add Item to supplier"
                      onClick={() => {
                        setShowAddItemSupplierModal(true);
                      }}
                      size="xs"
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
                      icon={<Store className="w-3 h-3 sm:w-5 sm:h-5" />}
                      label="Add Item to store"
                      onClick={() => {
                        setShowAddItemModal(true);
                      }}
                      size="xs"
                      className="font-semibold"
                      color="success"
                    />
                  </div>
                )}
              {selectedRows?.length &&
                selectedRows?.length > 0 &&
                (user?.empPosition === "staff" ||
                  user?.empPosition === "supervisor") && (
                  <div className="">
                    <Button
                      icon={<Store className="w-3 h-3 sm:w-5 sm:h-5" />}
                      label="Add Item to product"
                      onClick={() => {
                        setShowAddProductModal(true);
                      }}
                      size="xs"
                      className="font-semibold"
                      color="success"
                    />
                  </div>
                )}
              {user?.empPosition === "purchaser" ? (
                <div>
                  <Button
                    icon={<Plus className="w-3 h-3 sm:w-5 sm:h-5" />}
                    label="Add Item"
                    onClick={() => {
                      //add for stock room
                      setShowAdddModal(true);
                    }}
                    size="xs"
                    className="font-semibold"
                  />
                </div>
              ) : (
                <div>
                  <Button
                    icon={<Plus size={17} />}
                    // add for store item
                    label="Add Item"
                    onClick={() => {
                      setShowAdddModal(true);
                    }}
                    size="xs"
                    className="font-semibold"
                  />
                </div>
              )}
            </div>
          </>
        }
        renderActions={(row) => (
          <div className="flex gap-1 sm:gap-2 px-1 justify-center">
            <IconButton
              onClick={function (): void {
                setSelectedRow(row);
                setShowInventoryItemModal(true);
              }}
              label={"View"}
              bg={"nobg"}
              icon={<Eye className="w-3 h-3 sm:w-4 sm:h-4" />}
            />
            <IconButton
              onClick={function (): void {
                setSelectedRow(row);
              }}
              label={"Convert"}
              bg={"green"}
              icon={<ArrowLeftRight className="w-3 h-3 sm:w-4 sm:h-4" />}
            />
            <IconButton
              onClick={function (): void {
                setSelectedRow(row);
              }}
              label={"Delete"}
              bg={"red"}
              icon={<Trash className="w-3 h-3 sm:w-4 sm:h-4" />}
            />
          </div>
        )}
        totalCount={10}
      />
      <Modal
        title={"Add Item"}
        subtitle={"Enter item details below"}
        isOpen={showAddModal}
        onClose={() => {
          setShowAdddModal(false);
        }}
        size="lg"
        className="bg-white"
      >
        <AddItemModal
          user={user}
          onCancel={() => {
            setShowAdddModal(false);
          }}
          onSubmit={handleAddInventoryItem}
        />
      </Modal>
      {/* <Modal
        title="Create Inventory"
        subtitle="Register Inventory for your store"
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
        }}
        size="md"
        className="bg-white"
      >
        {" "}
        <CreateInventoryModal
          onCancel={() => {
            setShowCreateModal(false);
          }}
          onSubmit={handleCreateInventory}
        />
      </Modal> */}
      <Modal
        title="Add Item to store"
        subtitle="Select store to add this item to their inventory"
        isOpen={showAddItemModal}
        onClose={() => {
          setShowAddItemModal(false);
        }}
        size="lg"
        className="bg-white"
      >
        {" "}
        <AddItemStoreModal
          data={selectedRows ?? []}
          onCancel={() => {
            setShowAddItemModal(false);
          }}
          onSubmit={handleAddItemsToStore}
        />
      </Modal>

      <Modal
        title="Assign items to supplier"
        subtitle="Select supplier to assign this item to their item list"
        isOpen={showAddItemSupplierModal}
        onClose={() => {
          setShowAddItemSupplierModal(false);
        }}
        hasPadding={false}
        size="xl"
        className="bg-white h-[80%]"
      >
        <AddItemSupplierModal
          data={selectedRows ?? []}
          onCancel={() => {
            setShowAddItemSupplierModal(false);
          }}
          onSubmit={handleAddItemsToSupplier}
        />
      </Modal>
      <Modal
        title="Create Request"
        subtitle="Request stock for your store"
        isOpen={showCreateRequestModal}
        onClose={() => {
          setShowCreateRequestModal(false);
        }}
        size="xl"
        className="bg-white"
      >
        <CreateRequestModal
          data={selectedRows ?? []}
          onCancel={() => {
            setShowAddItemModal(false);
          }}
          onSubmit={handleCreateRequest}
          user={user}
        />
      </Modal>
      <Modal
        title="Create Inventory Report"
        subtitle="Create daily inventory report"
        isOpen={showCreateReportModal}
        onClose={() => {
          setShowCreateReportModal(false);
        }}
        size="xl"
        className="bg-white h-[80%]"
      >
        <CreateInventoryReport
        // data={selectedRows ?? []}
        // onCancel={() => {
        //   setShowAddItemModal(false);
        // }}
        // onSubmit={handleCreateRequest}
        // user={user}
        />
      </Modal>
      <Modal
        isOpen={showAddProductModal}
        onClose={function (): void {
          setShowAddProductModal(false);
        }}
        title="Add products"
        size="xl"
      >
        <AddItemToProductModal
          data={selectedRows ?? []}
          onCancel={function (): void {
            setShowAddProductModal(false);
          }}
          onSubmit={handleAddItemsToProduct}
        />
      </Modal>
      <Modal
        isOpen={showImportModal}
        onClose={function (): void {
          setShowImportModal(false);
        }}
        title="Import Item"
        size="xl"
        className="h-[95%]"
      >
        <ImportItemModal
          onSubmit={handleImportItem}
          loading={isSubmittingImport}
          onClose={() => setShowImportModal(false)}
        />
      </Modal>
      <Popup
        title={selectedRow?.itemName}
        subtitle="Inventory Item"
        background="transparent"
        isOpen={showInventoryItemModal}
        onClose={function (): void {
          setShowInventoryItemModal(false);
        }}
      >
        <ViewInventoryItem
          data={selectedRow ?? null}
          user={user}
          onSubmitStockAdjustment={handleSubmitStockAdjustment}
          isSubmittingAdjustment={isSubmittingAdjustment}
        />
      </Popup>
    </>
  );
};

export default InventorySection;
