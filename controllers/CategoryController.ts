import { CreateCategoryDto } from "@/dtos/category.dto";
import { insertCategory, selectCategories } from "../models/categoryModels";
import {
  getCategoriesById,
  getCategoriesByInventoryId,
} from "@/services/categories/get-categories";
import { CategoryInterface } from "@/types/categories";
import { updateCategoriesByFields } from "@/services/categories/update-categories";
import { deleteCategoriesByFields } from "@/services/categories/delete-categories";
import { processDeleteCategoriesByFields } from "@/services/categories/process-delete-categories";

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

export const editCategory = async ({
  updates,
  keyFields = ["categoryId"],
}: {
  updates: Partial<CategoryInterface>[];
  keyFields?: (keyof CategoryInterface)[];
}) => {
  try {
    const res = await updateCategoriesByFields({ updates, keyFields });
    return {
      success: true,
      message: "Category updated successfully!",
      data: res,
    };
  } catch (e) {
    console.error(e);
    return {
      success: false,
      message: "Failed to update category!",
      error: e,
    };
  }
};

export const deleteCategory = async ({
  updates,
  keyFields = ["categoryId"],
}: {
  updates: Partial<CategoryInterface>[];
  keyFields?: (keyof CategoryInterface)[];
}) => {
  try {
    const res = await processDeleteCategoriesByFields({ updates, keyFields });
    return {
      success: true,
      message: "Category deleted successfully!",
      data: res,
    };
  } catch (e) {
    console.error(e);
    return {
      success: false,
      message: "Failed to update category!",
      error: e,
    };
  }
};
