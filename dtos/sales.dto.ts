import { SaleItems, SalePayments, Sales } from "@/types/sales";
import { SalesDiscounts } from "@/types/sales-discounts";

export type CreateSaleDto = Pick<
  Sales,
  | "customerId"
  | "salesCreatedBy"
  | "salesSubTotal"
  | "salesTotalPaid"
  | "salesInvoice"
  | "salesNo"
  | "salesTotalAmount"
  | "storeId"
> & {
  salesItems?: CreateSaleItemDto[];
  salesPayments?: CreateSalePaymentDto[];
  saleDiscounts?: CreateSalesDiscount[];
};

export interface DisplaySalesDto extends Sales {
  customerName: string;
  salesCreatedByName: string;
  storeName: string;
}

export type CreateSaleItemDto = Pick<
  SaleItems,
  | "inventoryItemId"
  | "salesItemQuantity"
  | "salesId"
  | "salesItemPrice"
  | "salesItemSubtotal"
  | "prodVarId"
>;

export type CreateSalePaymentDto = Pick<
  SalePayments,
  | "paymentReference"
  | "salesId"
  | "salesPaymentAmount"
  | "payMetId"
  | "salesPaymentStatus"
>;

export type CreateSalesDiscount = Pick<
  SalesDiscounts,
  "discountAmount" | "discountId" | "saleId"
>;
