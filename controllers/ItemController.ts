import { CreateItemConversionDto, ImportItemInfo } from "@/dtos/items.dto";
import { findItemsByFields } from "@/services/items/get-item";
import { createItemConversion } from "@/services/items/item-conversion/create-item-conversion";
import { getItemConversionByFields } from "@/services/items/item-conversion/get-item-conversion";
import { processImportItems } from "@/services/items/processImportItems";
import { findItemsBySearch } from "@/services/itemServices";
import { ItemConversions, ItemInterface } from "@/types/items";
import { PoolConnection } from "mysql2/promise";

export const getItemBySearch = async (search: string) => {
  try {
    const data = await findItemsBySearch(search);
    return {
      data: data,
      message: "Item fetched successfully!",
      success: true,
    };
  } catch (e) {
    return {
      error: e,
      message: "Failed to fetched item!",
      success: false,
    };
  }
};

export const importItems = async (data: ImportItemInfo) => {
  try {
    const result = await processImportItems(data);
    return {
      data: result,
      message: "Item fetched successfully!",
      success: true,
    };
  } catch (e) {
    return {
      error: e,
      message: "Failed to fetched item!",
      success: false,
    };
  }
};

export const getItemByFields = async ({
  keyFields = {},
}: {
  keyFields?: Partial<ItemInterface>;
}) => {
  try {
    const data = await findItemsByFields({ keyFields });
    return {
      data: data,
      message: "Item fetched successfully!",
      success: true,
    };
  } catch (e) {
    return {
      error: e,
      message: "Failed to fetched item!",
      success: false,
    };
  }
};

export const createItemConversions = async ({
  data,
}: {
  data: CreateItemConversionDto;
}) => {
  try {
    const result = await createItemConversion({ data });
    return {
      result: result,
      message: "Successfully created conversion!",
      success: true,
    };
  } catch (e) {
    return {
      error: e,
      message: "Failed to create conversion!",
      success: false,
    };
  }
};

export const getItemConversions = async ({
  keyFields,
}: {
  keyFields: Partial<ItemConversions>;
}) => {
  try {
    const data = await getItemConversionByFields({ keyFields });
    return {
      data: data,
      message: "Item fetched successfully!",
      success: true,
    };
  } catch (e) {
    return {
      error: e,
      message: "Failed to fetched item!",
      success: false,
    };
  }
};
