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
  categoryId: number | null;
}

export interface ItemPrice {
  itemPriceId: number;
  itemPriceAmount: number;
  itemPriceCreatedAt: string;
  itemPriceCreatedBy: number;
  itemId: number;
}

export interface ItemConversions {
  itemConId: number;
  fromItemId: number;
  fromUnit: string;
  fromQuantity: number;
  toItemId: number;
  toUnit: string;
  toQuantity: number;
  itemConCreatedBy: number;
}
