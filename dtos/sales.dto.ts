import { SaleItems, SalePayments, Sales } from "@/types/sales";

export type CreateSaleDto = Pick<
  Sales,
  "customerId" | "receiptNo" | "salesCreatedBy" | "salesTotalAmount" | "storeId"
> & {
  salesItems?: CreateSaleItemDto[];
  salePayments?: CreateSalePaymentDto[];
};

export type CreateSaleItemDto = Pick<
  SaleItems,
  | "inventoryItemId"
  | "saleItemPrice"
  | "saleItemQuantity"
  | "saleItemSubtotal"
  | "salesId"
>;

export type CreateSalePaymentDto = Pick<
  SalePayments,
  "paymentReference" | "salesId" | "salesPaymentAmount" | "salesPaymentMethod"
>;
