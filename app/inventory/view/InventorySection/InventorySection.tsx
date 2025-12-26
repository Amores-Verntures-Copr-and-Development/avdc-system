import {
  DisplayInventoryItems,
  CreateFirstItem,
  CreateInventoryMovementDto,
} from "@/dtos/inventory.dto";
import { CreateRequestFormDto } from "@/dtos/request.dto";
import { UserAuth, useSession } from "@/hooks/useSession";

import { fetcher } from "@/utils/fetcher";
import React, { useCallback, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import useSWR from "swr";

import Table, { Column, TableHandle } from "@/components/shared/Table";
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
  Import,
  CheckCircleIcon,
  PackageX,
  Trash2Icon,
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
import AddItemToProductModal, {
  AddItemToProductStoreInterface,
} from "../../components/AddItemToProductModal";
import {
  CreateProductDtos,
  CreateProductVariantDto,
} from "@/dtos/products.dto";

import ImportItemModal from "../../components/ImportItemModal";
import { ImportItemInfo } from "@/dtos/items.dto";
import { capitalizeWords } from "@/utils/capitalizeWords";
import { InventoryItemInterface } from "@/types/inventory";
import { useRouter, useSearchParams } from "next/navigation";
import { useCategories } from "@/hooks/useCategory";
import { useInventoryItemUnit } from "@/hooks/useInventoryItemUnit";
import { ItemInterface } from "@/types/items";
import { ApiResponse } from "@/types/api";
import InStockModal from "../../components/InStockModal";
import OutStockModal from "../../components/OutStockModal";

export interface AddItemToStoreDto {
  storeId: number;
  addedById: number;
  items: DisplayInventoryItems[];
}

interface InventorySectionProps {
  inventoryId: number | null;
  user: UserAuth | null;
  inventoryType: "stores" | "stock-room" | "inventoryId";
  mutate: () => void;
}
const InventorySection: React.FC<InventorySectionProps> = ({
  inventoryId,
  mutate: mutateStats,
}) => {
  const searchParams = useSearchParams();
  const { categoryOptions } = useCategories({
    inventoryId: inventoryId ?? 0,
    reference: "inventoryId",
  });
  const { unitOptions } = useInventoryItemUnit({
    inventoryId: inventoryId ?? 0,
    reference: "inventoryId",
  });

  const router = useRouter();
  const tableRef = useRef<TableHandle>(null);
  const [showAddModal, setShowAdddModal] = useState(false);
  const [showInventoryItemModal, setShowInventoryItemModal] = useState(false);
  const [showCreateRequestModal, setShowCreateRequestModal] = useState(false);
  const [showInOrOutStock, setShowInOrOutStock] = useState<"in" | "out" | null>(
    null
  );
  const [showImportModal, setShowImportModal] = useState(false);
  const [showCreateInventoryReport, setShowCreateInventoryReport] =
    useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isSubmittingAdjustment, setIsSubmittingAdjustment] = useState(false);
  const [isSubmittingImport, setIsSubmittingImport] = useState(false);
  const [isEditingItem, setIsEditingItem] = useState(false);
  const { user, loading: userLoading, hasStore } = useSession();
  const [selectedRows, setSelectedRows] = useState<DisplayInventoryItems[]>();
  const [selectedRow, setSelectedRow] = useState<DisplayInventoryItems>();
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const inventoryItemColumns: Column<DisplayInventoryItems>[] = [
    {
      name: "#",
      key: "#",
      selector: (_row, index) => {
        // Get current page and limit from URL or context
        const searchParams = new URLSearchParams(window.location.search);
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "100", 10);

        // Calculate actual row number
        return (page - 1) * limit + index + 1;
      },
    },
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
            className={`px-2 py-1 text-[8px] xl:text-xs rounded-lg font-semibold ${bgClass} ${textClass}`}
          >
            {status}
          </span>
        );
      },
    },
  ];
  const adminInventoryItemColumns: Column<DisplayInventoryItems>[] = [
    {
      name: "#",
      key: "#",
      selector: (_row, index) => {
        // Get current page and limit from URL or context
        const searchParams = new URLSearchParams(window.location.search);
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "100", 10);

        // Calculate actual row number
        return (page - 1) * limit + index + 1;
      },
    },
    {
      name: "Item Name",
      key: "itemName",
      selector: (row) => (
        <span className="text-gray-800 font-semibold">{row.itemName}</span>
      ),
    },
    {
      name: "Stock Available",
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
          {formatQuantityByUnit(row.inventoryItemQuantity, row.itemUnit)}
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
      name: "Supplier",
      key: "itemSuppliers",
      selector: (row) => {
        const suppliers = row.itemSuppliers || [];
        // Assuming your row has a suppliers array

        return (
          <div className="group relative">
            <select
              className="border border-gray-300 rounded px-1 py-0.5 xl:px-2 xl:py-1 w-full text-[10px] xl:text-xs bg-gray-50 appearance-none cursor-default"
              disabled
            >
              <option value="">
                {suppliers.filter((s) => s !== null).length > 0
                  ? `Suppliers (${suppliers.filter((s) => s !== null).length})`
                  : "No Supplier"}
              </option>
            </select>

            {/* Show suppliers on hover */}
            {suppliers.filter((s) => s !== null).length > 0 && (
              <div className="absolute hidden group-hover:block z-10 top-full left-0 right-0 bg-white border border-gray-300 rounded shadow-lg max-h-32 overflow-y-auto">
                {suppliers
                  .filter((supplier) => supplier !== null)
                  .map((supplier, index) => (
                    <div
                      key={index}
                      className="px-2 py-1 text-[10px] xl:text-xs hover:bg-gray-100 cursor-default"
                    >
                      {`${supplier.suppName} (${formatPeso(
                        supplier.suppItemPrice
                      )})`}
                    </div>
                  ))}
              </div>
            )}
          </div>
        );
      },
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
            className={`inline-flex items-center text-center justify-center px-1.5 py-0.5 2xl:px-3 2xl:py-1 rounded-full text-[9px] xl:text-[10px] 2xl:text-xs font-semibold ${bgClass} ${textClass}`}
          >
            {status}
          </span>
        );
      },
    },
  ];

  //
  const [showAddItemSupplierModal, setShowAddItemSupplierModal] =
    useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  // get the stock inventory if purchaser
  const url = `/api/inventory/item/${inventoryId}`;
  const apiUrl = useMemo(() => {
    if (!inventoryId) return null;

    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const category = searchParams.get("category") || "";
    const unit = searchParams.get("unit") || "";
    const limit = searchParams.get("limit") || "";
    const page = searchParams.get("page") || "1";

    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (status) params.append("status", status);
    if (category) params.append("category", category);
    if (unit) params.append("unit", unit);
    if (limit) params.append("limit", limit);
    params.append("page", page);

    return `${url}?${params.toString()}`;
  }, [inventoryId, searchParams]);
  const {
    data: itemResponse,
    isLoading: loading,
    mutate,
  } = useSWR<ApiResponse<DisplayInventoryItems[]>>(apiUrl, fetcher);
  const handleClear = useCallback(() => {
    tableRef.current?.clearSelection();
  }, []);
  const handleSelectionChange = (selected: DisplayInventoryItems[]) => {
    // 👉 Here you can trigger bulk delete, bulk approve, etc.
    setSelectedRows(selected);
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
      handleClear();
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
  const handleAddItemsToProduct = async (
    data: AddItemToProductStoreInterface
  ) => {
    try {
      let productVariants: CreateProductVariantDto[] = [];
      if (data.isAddAsVariant && data.prodId) {
        productVariants = data.productVariant.map((prod) => ({
          ...prod,
          prodId: data.prodId || 0,
        }));
        const result = await fetch(
          `api/products/${data.storeId}/product-variants/${data.prodId}/create-bulk`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(productVariants),
          }
        );
        const res = await result.json();
        if (!res.success) {
          throw new Error(res.err);
        }
        toast.success("Inventory added successfully!");
        mutate();
        return true;
      }
      if (!data.isAddAsVariant) {
        alert("Create automatically as product");
        return true;
      }
      // const newData: CreateProductVariantDto[] =
      //   data.map((prod) => ({
      //     ...prod,
      //     productCreatedBy: user?.userId ?? 0,
      //     inventoryId: inventoryId ?? 0,
      //     isDeduct: 1,
      //   })) ?? [];
      // console.log("Product: ", newData);
      return false;
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
    setIsAddingItem(true);
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
    } finally {
      setIsAddingItem(false);
    }
  };

  const handleUpdateData = async () => {
    mutateStats();
    const updatedData = await mutate();
    // The updatedData should contain the fresh data
    const findSelectedInvItem = updatedData?.data.find(
      (inv) => inv.inventoryItemId === selectedRow?.inventoryItemId
    );
    if (findSelectedInvItem) {
      console.log("Selected PO: ", findSelectedInvItem);
      setSelectedRow(findSelectedInvItem);
    }
  };

  const handleSubmitStockAdjustment = async (
    data: CreateInventoryMovementDto
  ) => {
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
      mutateStats();
      toast.success(res.message);
      return true;
    } catch (e) {
      console.log(e);
      return false;
    } finally {
      setIsSubmittingAdjustment(false);
    }
  };
  const handleSubmitBulkStockAdjustment = async (
    data: CreateInventoryMovementDto[]
  ) => {
    setIsSubmittingAdjustment(true);
    try {
      const result = await fetch(`/api/inventory/movement/${inventoryId}`, {
        method: "PUT",
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
      mutateStats();
      mutate();
      handleClear();
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
        itemDescription: item.Description ?? "",
      })),
    };
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
      toast.error("Failed to import item");
      return false;
    } finally {
      setIsSubmittingImport(false);
    }
  };

  const handleEditInventoryItem = async (data: {
    itemData?: Partial<ItemInterface>;
    inventoryItemData?: Partial<InventoryItemInterface>;
  }) => {
    setIsEditingItem(true);
    try {
      const result = await fetch(
        `/api/inventory/item/${inventoryId}/${data.inventoryItemData?.inventoryItemId}`,
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
        throw new Error(res.err);
      }
      mutate();
      toast.success("Item details change successfully!");
      return true;
    } catch (e) {
      console.log({ e });
      toast.error("Failed to change item details!");
      return false;
    } finally {
      setIsEditingItem(false);
    }
  };

  const inventoryItemStatus = [
    { label: "Select Status", value: "" },
    { label: "Available", value: "good" },
    { label: "Low Stock", value: "low" },
    { label: "No stock", value: "no" },
  ];
  const inventoryConfig = useMemo(
    () => [
      {
        id: "status",
        label: "Status",
        type: "checkbox" as const,
        options: inventoryItemStatus,
      },
      {
        id: "category",
        label: "Category",
        type: "checkbox" as const,
        options: categoryOptions ?? [],
      },
      {
        id: "unit",
        label: "Unit",
        type: "checkbox" as const,
        options: unitOptions ?? [],
      },
    ],
    [categoryOptions, unitOptions]
  );
  const columns = useMemo(
    () => (hasStore ? inventoryItemColumns : adminInventoryItemColumns),
    [hasStore]
  );

  const handleFilterSave = useCallback(
    (newFilters: Record<string, string[]>) => {
      setFilters(newFilters);
      const currentParams = new URLSearchParams(window.location.search);
      const filterKeys = [...inventoryConfig.map((f) => f.id), "branch"];

      filterKeys.forEach((key) => currentParams.delete(key));

      Object.entries(newFilters).forEach(([key, values]) => {
        values.forEach((value) => currentParams.append(key, value));
      });

      router.push(`?${currentParams.toString()}`);
    },
    [router, inventoryConfig]
  );

  const handleDeleteItem = async (id: number) => {
    setIsEditingItem(true);
    try {
      const result = await fetch(
        `/api/inventory/item/${inventoryId}/${id}/delete`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const res = await result.json();
      if (!res.success) {
        throw new Error(res.err);
      }
      mutate();
      toast.success(res.message);
      return true;
    } catch (e) {
      console.log({ e });
      toast.error("Failed to delete item!");
      return false;
    } finally {
      setIsEditingItem(false);
    }
  };
  return (
    <>
      <Table
        uniqueIdKey="inventoryItemId"
        filterConfig={inventoryConfig}
        initialFilters={filters}
        loading={loading || userLoading}
        ref={tableRef}
        showFilter
        searchUrl="/inventory"
        columns={columns}
        data={itemResponse?.data ?? []}
        showActions
        maxHeight="h-full"
        rowSize="h-10"
        textSize="xs"
        onSave={handleFilterSave}
        showCheckBox
        onRowSelection={(row) => {
          setSelectedRow(row);
          setShowInventoryItemModal(true);
        }}
        onSelectionChange={handleSelectionChange}
        renderTopActions={
          <>
            <div className="flex">
              <div>
                <Button
                  isRounded={false}
                  icon={<Clipboard className="w-3 h-3 xl:w-5 xl:h-5" />}
                  label="Inventory Report"
                  onClick={() => {
                    setShowCreateInventoryReport(true);
                  }}
                  size="xs"
                  className="font-semibold"
                  color="secondary"
                />
              </div>
              <div>
                <Button
                  isRounded={false}
                  icon={<Import className="w-3 h-3 sm:w-5 xl:h-5" />}
                  label="Import Item"
                  onClick={() => {
                    setShowImportModal(true);
                  }}
                  size="xs"
                  className="font-semibold"
                  color="secondary"
                />
              </div>

              {Boolean(
                selectedRows?.length &&
                  selectedRows?.length > 0 &&
                  (user?.empPosition === "supervisor" ||
                    user?.empPosition === "staff")
              ) && (
                <div>
                  <Button
                    isRounded={false}
                    icon={<Store className="w-3 h-3 xl:w-5 xl:h-5" />}
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
              {Boolean(selectedRows?.length && selectedRows?.length > 0) && (
                <>
                  <div>
                    <Button
                      isRounded={false}
                      icon={
                        <CheckCircleIcon className="w-3 h-3 xl:w-5 xl:h-5" />
                      }
                      label="In Stock"
                      onClick={() => {
                        setShowInOrOutStock("in");
                      }}
                      size="xs"
                      className="font-semibold"
                      color="success"
                    />
                  </div>
                  <div>
                    <Button
                      isRounded={false}
                      icon={<PackageX className="w-3 h-3 xl:w-5 xl:h-5" />}
                      label="Out Stock"
                      onClick={() => {
                        // Check if ANY selected item has NO stock (quantity = 0)
                        const hasItemsWithNoStock = selectedRows?.some(
                          (item) => Number(item.inventoryItemQuantity) === 0
                        );
                        console.log({ selectedRows });
                        if (hasItemsWithNoStock) {
                          toast.error("Cannot move out items with zero stock!");
                          return;
                        }

                        setShowInOrOutStock("out");
                      }}
                      size="xs"
                      className="font-semibold"
                      color="danger"
                    />
                  </div>
                </>
              )}
              {Boolean(
                selectedRows?.length &&
                  selectedRows?.length > 0 &&
                  user?.empPosition !== "staff" &&
                  user?.empPosition !== "supervisor"
              ) && (
                <div className="">
                  <Button
                    isRounded={false}
                    icon={<Package className="w-3 h-3 xl:w-5 xl:h-5" />}
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
              {Boolean(
                user?.empPosition !== "staff" &&
                  user?.empPosition !== "supervisor"
              ) && (
                <div className="">
                  <Button
                    isRounded={false}
                    icon={<Store className="w-3 h-3 xl:w-5 xl:h-5" />}
                    label="Add Item to store"
                    onClick={() => {
                      setShowAddItemModal(true);
                    }}
                    size="xs"
                    className="font-semibold"
                    color="warning"
                  />
                </div>
              )}
              {Boolean(
                user?.empPosition === "staff" ||
                  user?.empPosition === "supervisor"
              ) && (
                <div className="">
                  <Button
                    isRounded={false}
                    icon={<Store className="w-3 h-3 xl:w-5 xl:h-5" />}
                    label="Add Item to product"
                    onClick={() => {
                      setShowAddProductModal(true);
                      console.log({ isAddingProduct });
                    }}
                    size="xs"
                    className="font-semibold"
                    color="warning"
                  />
                </div>
              )}
              {user?.empPosition === "purchaser" ? (
                <div>
                  <Button
                    isRounded={false}
                    icon={<Plus className="w-3 h-3 xl:w-5 xl:h-5" />}
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
                    isRounded={false}
                    icon={<Plus className="w-3 h-3 xl:w-5 xl:h-5" />}
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
          <div className="flex gap-1 xl:gap-2 px-1 justify-center">
            <IconButton
              onClick={function (): void {
                setSelectedRow(row);
                setShowInventoryItemModal(true);
              }}
              label={"View"}
              bg={"nobg"}
              icon={<Eye className="w-3 h-3 xl:w-4 xl:h-4" />}
            />
            <IconButton
              onClick={function (): void {
                console.log("Delete");
                setSelectedRow(row);
                setShowDeleteModal(true);
              }}
              label={"Delete"}
              bg={"red"}
              icon={<Trash className="w-3 h-3 xl:w-4 xl:h-4" />}
            />
          </div>
        )}
        totalCount={itemResponse?.totalItems}
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
          loading={isAddingItem}
        />
      </Modal>

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
        isOpen={showAddProductModal}
        onClose={function (): void {
          setShowAddProductModal(false);
        }}
        title="Add products"
        size="xl"
      >
        <AddItemToProductModal
          storeId={user?.storeId ?? 0}
          data={selectedRows ?? []}
          onCancel={function (): void {
            setShowAddProductModal(false);
          }}
          onSubmit={handleAddItemsToProduct}
          user={user}
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
        icon={Package}
        title={selectedRow?.itemName}
        subtitle={`ID: ${selectedRow?.inventoryItemId}`}
        background="transparent"
        isOpen={showInventoryItemModal}
        onClose={function (): void {
          setShowInventoryItemModal(false);
        }}
      >
        <ViewInventoryItem
          data={selectedRow ?? null}
          isLoadingInventory={loading}
          user={user}
          onSubmitStockAdjustment={handleSubmitStockAdjustment}
          isSubmittingAdjustment={isSubmittingAdjustment}
          mutate={handleUpdateData}
          onSubmitEditItems={handleEditInventoryItem}
          isEditing={isEditingItem}
        />
      </Popup>
      <Modal
        isOpen={showCreateInventoryReport}
        onClose={function (): void {
          setShowCreateInventoryReport(false);
        }}
        title="Create Inventory Report"
        size="xl"
        className="h-[95%]"
      >
        <CreateInventoryReport
          inventoryId={inventoryId ?? 0}
          user={user}
          mutateReport={mutate}
        />
      </Modal>
      <Modal
        isOpen={showInOrOutStock !== null}
        onClose={function (): void {
          setShowInOrOutStock(null);
        }}
        title={`${showInOrOutStock === "in" ? "In Stock" : "Out Stock"}`}
        size="xl"
        className="h-[95%]"
      >
        {showInOrOutStock === "in" ? (
          <InStockModal
            data={selectedRows ?? []}
            onSubmit={handleSubmitBulkStockAdjustment}
            onClose={() => {
              setShowInOrOutStock(null);
            }}
            isSubmitting={isSubmittingAdjustment}
          />
        ) : (
          <OutStockModal
            data={selectedRows ?? []}
            onSubmit={handleSubmitBulkStockAdjustment}
            onClose={() => {
              setShowInOrOutStock(null);
            }}
            isSubmitting={isSubmittingAdjustment}
          />
        )}
      </Modal>
      <Modal
        title="Delete Item From Inventory"
        leadingIcon={Trash2Icon}
        isOpen={showDeleteModal}
        onClose={function (): void {
          setShowDeleteModal(false);
        }}
      >
        <div className="flex flex-col gap-4">
          <div className="text-center mb-6">
            <p className="inline-flex flex-wrap items-center justify-center gap-1">
              <span>Are you sure you want to delete</span>
              <span className="font-semibold text-red-600">
                {selectedRow?.itemName}
              </span>
              <span>from inventory?</span>
              <span className="w-full text-sm text-gray-500 mt-2">
                This action cannot be undone.
              </span>
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <div>
              {" "}
              <Button
                size="sm"
                label="Cancel"
                color="secondary"
                onClick={() => {
                  setShowDeleteModal(false);
                }}
              />
            </div>
            <div>
              {" "}
              <Button
                size="sm"
                label="Confirm"
                color="danger"
                onClick={async () => {
                  if (!selectedRow) {
                    return;
                  }
                  const success = await handleDeleteItem(
                    selectedRow?.inventoryItemId
                  );
                  if (success) {
                    setShowDeleteModal(false);
                  }
                }}
              />
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default InventorySection;
