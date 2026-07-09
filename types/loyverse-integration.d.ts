// loyverseIntegration.interface.ts

export interface LoyverseIntegrationInterface {
  id: number;
  integId: number;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  merchantId: string | null;
  scope: string;
  expiresAt?: string | null;
  isActive: boolean;
  createdAt: string;
  connectedAt: string;
  updatedAt: string;
  createdBy: strin;
  storeId: string | null;
}

export interface MerchantInteface {
  id: string;
  business_name: string;
  email: string;
  country: string;
  currency: MerchantCurrency;
  created_at: string;
}

export interface MerchantCurrency {
  code: string;
  decimal_phase: number;
}

export interface LoyverseItem {
  id: string;
  handle: string;
  item_name: string;
  description: string;
  reference_id: string | null;
  category_id: string | null;
  track_stock: boolean;
  sold_by_weight: boolean;
  is_composite: boolean;
  use_production: boolean;
  components: LoyverseItemComponent[];
  primary_supplier_id: string | null;
  tax_ids: string[];
  modifiers_ids: string[];
  form: string;
  color: string;
  image_url: string | null;
  option1_name: string | null;
  option2_name: string | null;
  option3_name: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  variants: LoyverseItemVariant[];
}

export interface LoyverseItemComponent {
  variant_id: string;
  quantity: number;
}

export interface LoyverseItemVariant {
  variant_id: string;
  item_id: string;
  sku: string | null;
  reference_variant_id: string | null;
  option1_value: string | null;
  option2_value: string | null;
  option3_value: string | null;
  barcode: string | null;
  cost: number;
  purchase_cost: number;
  default_pricing_type: "FIXED" | "VARIABLE";
  default_price: number | null;
  stores: LoyverseItemStore[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface LoyverseItemStore {
  store_id: string;
  pricing_type: "FIXED" | "VARIABLE";
  price: number;
  available_for_sale: boolean;
  optimal_stock: number | null;
  low_stock: number | null;
}

export interface LoyverseStore {
  id: string;
  name: string;
  address: string;
}
export type ReceiptType = "SALE" | "REFUND";

export interface LoyverseReceipt {
  receipt_number: string;
  note: string | null;
  receipt_type: ReceiptType;
  refund_for: string;
  order: string | null;
  created_at: string;
  updated_at: string;
  source: string;
  receipt_date: string;
  cancelled_at: null | string;
  total_money: number;
  total_tax: number;
  total_discount;
  store_id;
  total_discounts: [];
  total_taxes: [];
  tip: number;
  surcharge: number;
  line_items: LoyverseReceiptLineItem[];
  payments: LoyversePayments[];
}

export interface LoyverseReceiptLineItem {
  id: string;
  item_id: string;
  variant_id: string;
  item_name: string;
  variant_name: string | null;
  sku: string | null;
  quantity: number;
  price: number;
  gross_total_money: number;
  total_money: number;
  cost: number;
  cost_total: number;
  line_note: string | null;
  line_taxes: LoyverseLineTax[];
  total_discount: number;
  line_discounts: LoyverseLineDiscount[];
  line_modifiers: LoyverseLineModifier[];
}
export interface LoyverseLineDiscount {
  id: string;
  name: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  amount: number;
}

export interface LoyverseLineModifier {
  id: string;
  modifier_id: string;
  name: string;
  price: number;
  quantity: number;
}
export interface TotalDiscount {
  id: string;
  type: "FIXED_PERCENT";
  name: string;
  percentage: number;
  money_amount: number;
}
export interface LoyversePayments {
  payment_type_id: string;
  name: string;
  type: string;
  money_amount: number;
  paid_at: string;
  payment_details: null | string;
}
