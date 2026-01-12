import { Discounts } from "@/types/discount";
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
  saleItems: DisplaySalesItems[];
  paymentMethods: SalePaymentMethods[];
  totalItem: number;
  salesDiscounts: SaleDiscountExtends[];
}

interface SalePaymentMethods extends SalePayments, PaymentMethods {}
interface SaleDiscountExtends extends SalesDiscounts, Discounts {}
export interface DisplaySalesItems
  extends SaleItems,
    Products,
    ProductVariants {
  saleItemName?: string;
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
