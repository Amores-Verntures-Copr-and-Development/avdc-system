import { CreateCategoryDto } from "@/dtos/category.dto";
import { insertCategory, selectCategories } from "../models/categoryModels";

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
  categoryType,
}: {
  categoryType?: string;
}) => {
  try {
    const data = await selectCategories({ categoryType });
    return {
      success: true,
      message: "Category fetched successfully!",
      data: data ?? null,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to fetch category!",
      error: e,
    };
  }
};
