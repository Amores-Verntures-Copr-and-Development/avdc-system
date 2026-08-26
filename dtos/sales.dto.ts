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
  Partial<Pick<Sales, "salesSource" | "orderId">> & {
    salesItems?: CreateSaleItemDto[];
    salesPayments?: CreateSalePaymentDto[];
    saleDiscounts?: CreateSalesDiscount[];
    vouchers?: CreateSalesVoucherDto[];
    // Vouchers already redeemed elsewhere (e.g. on the source Order this
    // sale was converted from) - only records the SalesVoucher link so the
    // sale shows/reports the voucher, without re-validating or decrementing
    // the voucher's balance a second time. Use `vouchers` above instead for
    // a fresh redemption happening on this sale.
    linkedVouchers?: CreateSalesVoucherDto[];
    // Backdates the sale record (e.g. manually logging a past sale) - defaults
    // to CURRENT_TIMESTAMP at the DB level when omitted.
    salesCreatedAt?: string;
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
  salesApprovedByName: string | null;
  storeName: string;
  saleItems: DisplaySalesItems[];
  salesRefunds: SalesRefund[];
  paymentMethods: SalePaymentMethods[];
  totalItem: number;
  salesDiscounts: SaleDiscountExtends[];
  salesPaymentRefunds: SalesPaymentRefund[];
  vouchers: DisplaySalesVoucherDto[];
}

export interface DisplaySalesVoucherDto {
  salesVoucherId: number;
  voucherId: number;
  voucherCode: string;
  voucherName: string | null;
  salesVoucherAmount: number;
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
