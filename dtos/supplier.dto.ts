import { Supplier, SupplierItem, SupplierItemPrices } from "@/types/supplier";

export type CreateSupplierDto = Pick<
  Supplier,
  | "suppCode"
  | "suppContactPerson"
  | "suppCreatedBy"
  | "suppEmail"
  | "suppName"
  | "suppPhone"
  | "suppAddress"
>;

export type CreateSupplierItemDto = Pick<
  SupplierItem,
  "itemId" | "suppItemPrice" | "suppItemCreatedBy" | "suppId"
>;

export interface DisplaySupplierItemDto extends SupplierItem {
  itemName: number;
  categoryName: string;
  itemUnit: string;
  categoryType: string;
  supplierName: string;
}

export type CreateSupplierItemPriceDto = Pick<
  SupplierItemPrices,
  "sipAmount" | "sipCreatedBy" | "suppItemId"
>;
