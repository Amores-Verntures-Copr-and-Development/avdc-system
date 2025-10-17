export type CategoryType = "product" | "item" | null;

export interface CategoryInterface {
  categoryId: number;
  categoryName: string;
  categoryType: CategoryType;
  storeId: number;
  categoryCreatedAt: string;
  categoryUpdatedAt: string;
  categoryDeletedAt: string;
  categoryCreatedBy: number;
}
