import { selectStores } from "../models/storeModels";
import {
  CreateFirstItem,
  CreateInventoryDto,
  CreateInventoryItemDto,
  CreateInventoryMovementDto,
} from "@/dtos/inventory.dto";
import {
  insertInventoryItem,
  updateInventoryItems,
} from "../models/inventoryModels";
import { handleCreateItem } from "../services/itemServices";
import { getDBConnection } from "../lib/db";
import { CreateItemDto } from "@/dtos/items.dto";
import { PoolConnection } from "mysql2/promise";
import {
  handleFindInventoryByStoreId,
  handleInsertItemInventory,
  handleInsertItemInventoryBulk,
} from "../services/inventoryItemServices";

import {
  InventoryInterface,
  InventoryItemInterface,
  InventoryItemMovement,
} from "@/types/inventory";
import {
  findInventoryByFields,
  findInventoryByStockPurchaserFields,
  findInventoryByStoreFields,
} from "@/services/inventory/get-inventory";
import {
  findDuplicateInventoryItems,
  findInventoryForReport,
  findInventoryItemsByField,
  findInventoryItemsNotInStore,
  findInventoryItemUnitByInventoryId,
  findInventoryNotInProduct,
  getInventoryItemsStatus,
} from "@/services/inventory/inventory-items/get-inventory-items";
import { getInventoryMovement } from "@/services/inventory/inventory-movement/get-inventory-movement";
import {
  processStockAdjustment,
  processStockBulkAdjustment,
} from "@/services/inventory/inventory-movement/process-stock-adjsutment";
import { StockPurchasers } from "@/types/stockRoom";
import { StoreInterface } from "@/types/stores";
import { AddItemToStoreDto } from "@/app/inventory/view/InventorySection/InventorySection";
import { ItemInterface } from "@/types/items";
import { updateItems } from "@/models/itemModel";
import { handleUpdateItemOrInventory } from "@/services/inventory/inventory-items/update-inventory-items";
import { deleteInventoryItems } from "@/services/inventory/inventory-items/delete-inventory-items";
import { deleteBarcodeByFields } from "@/controllers/BarcodeController";
import { createInventoryItem } from "@/services/inventory/inventory-items/create-inventory-items";
import { addAllItemsFromStoreToInventory } from "@/services/inventory/inventory-items/process-add-all-items-from-store";
import { resolveDuplicateInventoryItems } from "@/services/inventory/inventory-items/resolve-duplicate-inventory-items";
import { InventoryReferenceType } from "@/types/inventory";

export const getInventory = async ({
  keyFields = {},
  controller,
  keySpFields = {},
  keyStoreFields = {},
}: {
  controller?: "stockPurchaser" | "store" | "stock-room";
  keyFields?: Partial<InventoryInterface>;
  keySpFields?: Partial<StockPurchasers>;
  keyStoreFields?: Partial<StoreInterface>;
}) => {
  try {
    let data;
    if (controller === "stockPurchaser") {
      data = await findInventoryByStockPurchaserFields({
        keyFields: keySpFields,
      });
    } else if (controller === "store") {
      data = await findInventoryByStoreFields({
        keyFields: keyStoreFields,
      });
    } else {
      data = await findInventoryByFields({ keyFields });
    }
    return {
      success: true,
      message: "Inventory fetched successfully!",
      data: data ?? null,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to fetched Inventory!",
      error: e,
    };
  }
};

export const createInventoryItemController = async (
  data: CreateInventoryItemDto,
) => {
  try {
    await createInventoryItem({ data });
    return {
      success: true,
      message: "Item added to inventory successfully!",
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to add item in inventory!",
      error: e,
    };
  }
};
export const getInventoryItems = async ({
  keyFields,
  search,
  status,
  category,
  unit,
  limit,
  offset,
  movement,
  supplier,
}: {
  keyFields: Partial<InventoryInterface>;
  search?: string;
  status?: string;
  category?: string;
  unit?: string;
  limit?: number;
  offset?: number;
  movement?: string;
  supplier?: string;
}) => {
  try {
    const data = await findInventoryItemsByField({
      keyFields: keyFields,
      search,
      status,
      category,
      unit,
      limit,
      offset,
      movement,
      supplier,
    });

    return {
      success: true,
      message: "Item fetched successfully!",
      data: data ?? null,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to fetched Item!",
      error: e,
    };
  }
};

export const getInventoryItemByFileds = async ({
  keyFields,
}: {
  keyFields: Partial<InventoryItemInterface>;
}) => {
  try {
    const data = await findInventoryItemsByField({
      keyFields: keyFields,
    });
    return {
      success: true,
      message: "Item fetched successfully!",
      data: data.data ?? null,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to fetched Item!",
      error: e,
    };
  }
};

export const addItemToInventory = async (data: CreateFirstItem) => {
  const pool = await getDBConnection();
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    if (!data) {
      return {
        success: false,
        message: "No data found!",
      };
    }

    // const existingItems = await findInventoryItemsByField({
    //   connection,
    //   keyFields: {
    //     inventoryId: data.inventoryId,
    //     inventoryItemReferenceType: "item",
    //     inventoryItemReferenceId: data.inventoryItemReferenceId,
    //   },
    // });

    // if (existingItems.data.length > 0) {
    //   return {
    //     success: false,
    //     message: "Item already exists in inventory!",
    //   };
    // }

    const itemData: CreateItemDto = {
      categoryId: data.categoryId,
      itemAddedBy: data.itemAddedBy,
      itemName: data.itemName,
      itemPrice: data.itemPrice,
      itemUnit: data.itemUnit,
      itemDescription: data.itemDescription,
    };
    const itemId = await handleCreateItem(connection, itemData);
    const inventoryItemData: CreateInventoryItemDto = {
      ...data,
      inventoryItemReferenceId: itemId,
      inventoryItemReferenceType: "item",
    };
    const insertResult = await handleInsertItemInventory(
      connection,
      inventoryItemData,
    );
    await connection.commit();
    return {
      success: true,
      message: "Item fetched successfully!",
      data: {
        ...data,
        itemId,
        inventoryItemId:
          "insertId" in insertResult ? insertResult.insertId : null,
      },
    };
  } catch (e) {
    console.log(e);
    await connection.rollback();
    return {
      success: false,
      message: "Failed to add item in inventory!",
      error: e,
    };
  } finally {
    connection.release();
  }
};

export const addItemToStoreInventory = async (data: AddItemToStoreDto) => {
  const pool = await getDBConnection();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const storeInventory: InventoryInterface[] =
      await handleFindInventoryByStoreId({
        storeId: data.storeId,
      });
    if (!storeInventory) {
      throw new Error("No inventory found for that store");
    }

    const existingItems = await findInventoryItemsByField({
      connection,
      keyFields: {
        inventoryId: storeInventory[0].inventoryId,
        inventoryItemReferenceType: "item",
      },
    });
    const existingIds = new Set(
      existingItems.data.map((i) => i.inventoryItemReferenceId),
    );

    // Filter duplicates
    const duplicateItems = data.items.filter((item) =>
      existingIds.has(item.inventoryItemReferenceId),
    );

    if (duplicateItems.length > 0) {
      const names = duplicateItems.map((i) => i.itemName);
      throw new Error(`Item(s) already exist in store: ${names.join(", ")}`);
    }

    const storeInventoryId = storeInventory[0].inventoryId;
    const newData: CreateInventoryItemDto[] = data.items.map((item) => ({
      inventoryId: storeInventoryId,
      inventoryItemReferenceType: "item", // <-- adjust if you have other types
      inventoryItemReferenceId: item.inventoryItemReferenceId,
      inventoryItemQuantity: 0,
      inventoryItemMin: 0,
      inventoryItemCreatedBy: data.addedById,
    }));
    await handleInsertItemInventoryBulk(connection, newData);
    await connection.commit();
    return {
      success: true,
      message: "Item add successfully!",
    };
  } catch (e) {
    console.log("Error at contoller: ", e);
    await connection.rollback();
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to add item!",
      error: e,
    };
  } finally {
    connection.release();
  }
};

export const getInventoryMovements = async ({
  keyFields = {},
  search,
  from,
  to,
  type,
  category,
}: {
  search?: string;
  from?: string;
  to?: string;
  type?: string;
  keyFields?: Partial<InventoryItemMovement>;
  category?: string; // dynamic filters like {inventoryId: 1, storeId: null}
}) => {
  try {
    const data = await getInventoryMovement({
      keyFields,
      search,
      from,
      to,
      type,
      category,
    });
    return {
      success: true,
      message: "Item fetched successfully!",
      data: data ?? null,
    };
  } catch (e) {
    return {
      success: true,
      message: e,
      error: e,
    };
  }
};

export const getInventoryItemsStatusById = async (inventoryId: number) => {
  try {
    const data = await getInventoryItemsStatus(inventoryId);
    return {
      success: true,
      message: "Item fetched successfully!",
      data: data ?? null,
    };
  } catch (e) {
    return {
      success: true,
      message: e,
      error: e,
    };
  }
};

export const processStockAdjustmetController = async (
  data: CreateInventoryMovementDto,
) => {
  try {
    const res = await processStockAdjustment(data);
    return { success: true, message: "Successfully adjust stock", result: res };
  } catch (e) {
    return { success: false, message: "Failed to adjust stock", error: e };
  }
};

export const processStockBulkAdjustmetController = async (
  data: CreateInventoryMovementDto[],
) => {
  try {
    const res = await processStockBulkAdjustment(data);
    return { success: true, message: "Successfully adjust stock", result: res };
  } catch (e) {
    return { success: false, message: "Failed to adjust stock", error: e };
  }
};

export const updateInventoryItem = async ({
  itemData,
  inventoryItemData,
}: {
  itemData?: Partial<ItemInterface>;
  inventoryItemData?: Partial<InventoryItemInterface>;
}) => {
  try {
    if (!inventoryItemData) {
      throw new Error("No data found!");
    }
    const res = await updateInventoryItems({
      updates: [inventoryItemData],
    });
    return { success: true, message: "Successfully adjust stock", result: res };
  } catch (e) {
    return { success: false, message: "Failed to adjust stock", error: e };
  }
};

export const getInventoryItemUnit = async (inventoryId: number) => {
  try {
    const data = await findInventoryItemUnitByInventoryId(inventoryId);
    return {
      success: true,
      message: "Item fetched successfully!",
      data: data ?? null,
    };
  } catch (e) {
    return {
      success: true,
      message: e,
      error: e,
    };
  }
};

export const getInventoryItemsByDate = async ({
  range,
  inventoryId,
}: {
  inventoryId: number;
  range: { from: string; to: string };
}) => {
  try {
    const data = await findInventoryForReport({ range, inventoryId });
    return {
      success: true,
      message: "Item fetched successfully!",
      data: data ?? null,
    };
  } catch (e) {
    return {
      success: true,
      message: e,
      error: e,
    };
  }
};

export const updateItemOrInventory = async ({
  itemData,
  inventoryData,
}: {
  itemData: Partial<ItemInterface>[];
  inventoryData: Partial<InventoryItemInterface>[];
}) => {
  try {
    const result = await handleUpdateItemOrInventory({
      itemData,
      inventoryData,
    });

    return {
      success: true,
      message: "Item successfully edit!",
      result: result,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to update item",
      error: e,
    };
  }
};

export const searchInventoryItems = async ({
  keyFields = {},
  search,
  status,
  category,
  unit,
}: {
  keyFields?: Partial<InventoryItemInterface>;
  search?: string;
  status?: string;
  category?: string;
  unit?: string; // dynamic filters like {inventoryId: 1, storeId: null}
}) => {
  try {
    const data = await findInventoryItemsByField({});
  } catch (e) {}
};

export const deleteInventoryItemById = async ({
  inventoryItemId,
}: {
  inventoryItemId: number[];
}) => {
  try {
    const data: Partial<InventoryItemInterface>[] = inventoryItemId.map(
      (id) => ({ inventoryItemId: id }),
    );
    const result = await deleteInventoryItems({ updates: data });

    if (inventoryItemId.length) {
      const now = new Date().toISOString().slice(0, 19).replace("T", " ");

      await deleteBarcodeByFields({
        keyFields: ["inventoryItemId"],
        updates: inventoryItemId.map((id) => ({
          inventoryItemId: id,
          deletedAt: now,
        })),
      });
    }

    return {
      success: true,
      message: "Item successfully deleted!",
      result: result,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to delete item",
      error: e,
    };
  }
};

// export const getInventoryItemsNotInProduct = async () => {
//   try {
//     const data = await findInventoryForReport({ range, inventoryId });
//     return {
//       success: true,
//       message: "Item fetched successfully!",
//       data: data ?? null,
//     };
//   } catch (e) {
//     return {
//       success: true,
//       message: e,
//       error: e,
//     };
//   }
// };

export const getInventoryNotInProduct = async ({
  storeId,
}: {
  storeId: number;
  search?: string;
  limit?: number;
  offset?: number;
}) => {
  try {
    const res = await findInventoryNotInProduct({ storeId: storeId });

    return {
      success: true,
      message: "Fetch inventory items not in product!",
      data: res,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to fetch inventory items not in product!",
      error: e,
    };
  }
};

export const getInventoryNotInStoreController = async ({
  inventoryId,
  storeId,
  limit,
  skip,
}: {
  inventoryId: number;
  storeId: number;
  limit?: number;
  skip?: number;
}) => {
  try {
    const res = await findInventoryItemsNotInStore({
      inventoryId: inventoryId,
      storeId: storeId,
      limit,
      skip,
    });
    return {
      success: true,
      data: res.data,
      count: res.count,
      message: "Good",
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed",
      error: e,
    };
  }
};

export const getInventoryDuplicatesController = async ({
  inventoryId,
  search,
  limit,
  skip,
}: {
  inventoryId: number;
  search?: string;
  limit?: number;
  skip?: number;
}) => {
  try {
    const res = await findDuplicateInventoryItems({
      inventoryId,
      search,
      limit,
      skip,
    });
    return {
      success: true,
      data: res.data,
      count: res.count,
      message: "Good",
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed",
      error: e,
    };
  }
};

export const resolveInventoryDuplicatesController = async ({
  inventoryId,
  inventoryItemReferenceType,
  inventoryItemReferenceId,
}: {
  inventoryId: number;
  inventoryItemReferenceType?: InventoryReferenceType;
  inventoryItemReferenceId?: number;
}) => {
  try {
    const result = await resolveDuplicateInventoryItems({
      inventoryId,
      inventoryItemReferenceType,
      inventoryItemReferenceId,
    });
    return {
      success: true,
      data: result,
      message:
        result.removedRows > 0
          ? `Removed ${result.removedRows} duplicate row${result.removedRows === 1 ? "" : "s"}!`
          : "No duplicate rows found to remove!",
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to remove duplicate items!",
      error: e,
    };
  }
};

export const addAllItemFromStoreToInventoryController = async ({
  inventoryId,
  storeId,
  userId,
}: {
  inventoryId: number;
  storeId: number;
  userId: number;
}) => {
  try {
    const res = await addAllItemsFromStoreToInventory({
      inventoryId,
      storeId,
      userId,
    });
    return {
      success: true,
      message: "Items added to your inventory successfully!",
      data: res,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to add items in your inventory!",
      error: e,
    };
  }
};
