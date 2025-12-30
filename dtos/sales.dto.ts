import { SaleItems, SalePayments, Sales } from "@/types/sales";
import { SalesDiscounts } from "@/types/sales-discounts";

export type CreateSaleDto = Pick<
  Sales,
  | "customerId"
  | "salesCreatedBy"
  | "salesInvoice"
  | "salesNo"
  | "salesTotalAmount"
  | "storeId"
> & {
  salesItems?: CreateSaleItemDto[];
  salesPayments?: CreateSalePaymentDto[];
  saleDiscounts?: CreateSalesDiscount[];
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
  "paymentReference" | "salesId" | "salesPaymentAmount" | "payMetId"
>;

export type CreateSalesDiscount = Pick<
  SalesDiscounts,
  "discountAmount" | "discountId" | "saleId"
>;
