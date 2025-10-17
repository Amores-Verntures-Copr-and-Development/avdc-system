export interface ItemInterface {
  itemId: number;
  itemName: string;
  itemDescription?: string | null;
  itemUnit: string;
  itemPrice: number;
  itemCreatedAt: string;
  itemUpdatedAt: string;
  itemDeletedAt?: string | null;
  itemAddedBy: number; // userId
  categoryId: number;
}
