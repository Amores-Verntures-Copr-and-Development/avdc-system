import { CategoryInterface, CategoryType } from "@/types/categories";

export type CreateCategoryDto = Pick<
  CategoryInterface,
  | "categoryName"
  | "categoryType"
  | "categoryCreatedBy"
  | "categoryReferenceId"
  | "categoryReferenceType"
>;
