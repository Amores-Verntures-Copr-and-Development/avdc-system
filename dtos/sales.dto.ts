import { PaymentMethods } from "@/types/payment-methods";
import { ProductPrices, Products, ProductVariants } from "@/types/products";
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
  | "salesStatus"
> & {
  salesItems?: CreateSaleItemDto[];
  salesPayments?: CreateSalePaymentDto[];
  saleDiscounts?: CreateSalesDiscount[];
};

export interface DisplaySalesDto extends Sales {
  customerName: string;
  salesCreatedByName: string;
  storeName: string;
  paymentMethods: SalePaymentMethods[];
  totalItem: number;
}

interface SalePaymentMethods extends SalePayments, PaymentMethods {}

export interface DisplaySalesItems
  extends SaleItems,
    Products,
    ProductVariants {}

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
