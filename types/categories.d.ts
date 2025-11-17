export type CategoryType = "product" | "item" | "services" | null;

export interface CategoryInterface {
  categoryId: number;
  categoryName: string;
  categoryType: CategoryType;
  categoryReferenceType: "stores" | "stock-room" | null;
  categoryReferenceId: number;
  categoryCreatedAt: string;
  categoryUpdatedAt: string;
  categoryDeletedAt: string;
  categoryCreatedBy: number;
}
