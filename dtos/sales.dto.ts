import { ComponentsVariant } from "@/app/pos/PosPage";
import { Discounts, DiscountType } from "@/types/discount";
import { PaymentMethods } from "@/types/payment-methods";
import {
  ProductPrices,
  Products,
  ProductVariants,
  VariantComponents,
} from "@/types/products";
import {
  SaleItems,
  SalePayments,
  Sales,
  SalesItemDiscounts,
} from "@/types/sales";
import { SalesDiscounts } from "@/types/sales-discounts";
import {
  SalesItemRefund,
  SalesPaymentRefund,
  SalesRefund,
} from "@/types/sales-refund";

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
  | "salesRemarks"
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
  salesRefunds: SalesRefund[];
  paymentMethods: SalePaymentMethods[];
  totalItem: number;
  salesDiscounts: SaleDiscountExtends[];
  salesPaymentRefunds: SalesPaymentRefund[];
}

interface SalePaymentMethods extends SalePayments, PaymentMethods {}
interface DisplaySaleItemDiscounts extends SalesItemDiscounts, Discounts {}
interface SaleDiscountExtends extends SalesDiscounts, Discounts {}
export interface DisplaySalesItems
  extends SaleItems, Products, ProductVariants {
  saleItemName?: string;
  salesItemsDiscount?: DisplaySaleItemDiscounts[];
  salesItemsRefunds: SalesItemRefund[];
}

export type CreateSaleItemDto = Pick<
  SaleItems,
  | "salesItemQuantity"
  | "salesId"
  | "salesItemPrice"
  | "salesItemSubtotal"
  | "prodVarId"
  | "salesItemTotal"
> & {
  components?: ComponentsVariant[];
  salesItemDiscounts?: CreateSaleItemDisc[];
};

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

export type CreateSaleItemDisc = Pick<
  SalesItemDiscounts,
  "discountAmount" | "discountId" | "salesItemId" | "salesItemDiscCreatedBy"
> & {
  discountType?: DiscountType;
};

// export type CreateSaleRefundPayment = Pick<Sa>
