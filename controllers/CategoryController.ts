import { CreateCategoryDto } from "@/dtos/category.dto";
import { insertCategory, selectCategories } from "../models/categoryModels";
import {
  getCategoriesById,
  getCategoriesByInventoryId,
} from "@/services/categories/get-categories";

export const createCategory = async (data: CreateCategoryDto) => {
  try {
    await insertCategory(data);
    return {
      success: true,
      message: "Category created successfully!",
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to create category!",
      error: e,
    };
  }
};

export const getCategories = async ({
  controller,
  id,
}: {
  controller: "storeId" | "stockRoomId" | "inventoryId" | null;
  id?: number;
}) => {
  try {
    let data;
    if (controller === "storeId") {
   
      data = await getCategoriesById({ storeId: id });
    } else if (controller === "stockRoomId") {
      data = await getCategoriesById({ stockRoomId: id });
  
    } else if (controller === "inventoryId" && id) {
      data = await getCategoriesByInventoryId({ inventoryId: id });
    }
    return {
      success: true,
      message: "Category fetched successfully!",
      data: data ?? null,
    };
  } catch (e) {
    console.error(e);
    return {
      success: false,
      message: "Failed to fetch category!",
      error: e,
    };
  }
};
