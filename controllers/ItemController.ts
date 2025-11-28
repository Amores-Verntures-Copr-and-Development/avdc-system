import { ImportItemInfo } from "@/dtos/items.dto";
import { processImportItems } from "@/services/items/processImportItems";
import { findItemsBySearch } from "@/services/itemServices";

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

