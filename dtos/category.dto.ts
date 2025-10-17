import { CategoryInterface } from "@/types/categories";

export type CreateCategoryDto = Pick<
  CategoryInterface,
  "categoryName" | "categoryType" | "categoryCreatedBy"
>;

export type DisplayCategoryDto = Pick<
  CategoryInterface,
  | "categoryId"
  | "categoryName"
  | "categoryType"
  | "categoryCreatedBy"
  | "categoryCreatedAt"
  | "storeId"
> & {
  storeName: number;
};
