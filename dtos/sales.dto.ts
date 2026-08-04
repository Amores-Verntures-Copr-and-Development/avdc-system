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
import { CreateSalesVoucherDto } from "@/dtos/voucher.dto";

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
> &
  Partial<Pick<Sales, "salesSource">> & {
    salesItems?: CreateSaleItemDto[];
    salesPayments?: CreateSalePaymentDto[];
    saleDiscounts?: CreateSalesDiscount[];
    vouchers?: CreateSalesVoucherDto[];
    // human-readable Order number, only set when salesSource === "order" - not persisted, just carried through for the receipt email
    orderNumber?: string;
    // Order's delivery fee, only set when salesSource === "order" - not persisted, just carried through for the receipt email
    deliveryFee?: number;
    // Order's delivery address/customer phone, only set when salesSource === "order" - not persisted, just carried through for the receipt email
    deliveryAddress?: string | null;
    customerPhone?: string | null;
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
  salesItemDiscounts?: DisplaySaleItemDiscounts[];
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
  inventoryItemId: number | null;
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
