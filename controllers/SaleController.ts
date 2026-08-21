import { CreateSalesRefundDto } from "@/dtos/sales-refund.dto";
import { CreateSaleDto } from "@/dtos/sales.dto";
import { UserAuth } from "@/hooks/useSession";
import { processCreateSaleRefund } from "@/services/sales-refund/process-create-sales-refund";
import {
  getDailyStoreSales,
  getSalesServices,
} from "@/services/sales/get-sales";
import { processCreateSales } from "@/services/sales/process-create-sales";
import { getSalesItemServices } from "@/services/sales/sale-items/get-sale-items";
import { updateSalesBySalesId } from "@/services/sales/update-sales";
import { sendEmailSalesBasePaymentMethods } from "@/services/sales/send-email-sales";
import { Sales } from "@/types/sales";

export const createSale = async (data: CreateSaleDto) => {
  try {
    const res = await processCreateSales(data);
    return {
      success: true,
      message: "Order process successfully!",
      data: res,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to process order!",
      error: e,
    };
  }
};

export const updateSalesController = async ({
  data,
}: {
  data: Partial<Sales>;
}) => {
  try {
    if (!data.salesId) {
      throw new Error("No sales ID found!");
    }
    const res = await updateSalesBySalesId({
      salesId: data.salesId,
      data: data,
    });
    return {
      success: true,
      message: "Sales updated successfully!",
      data: res ?? null,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to update sales!",
      error: e,
    };
  }
};

export const sendSalesReceiptEmailController = async ({
  salesId,
}: {
  salesId: number;
}) => {
  try {
    const result = await sendEmailSalesBasePaymentMethods({
      salesId,
      force: true,
    });

    if (!result.sent) {
      return {
        success: false,
        message: result.reason ?? "Failed to send receipt email!",
      };
    }

    return {
      success: true,
      message: "Receipt email sent!",
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to send receipt email!",
      error: e,
    };
  }
};

export const refundSalesController = async ({
  data,
  decoded,
  password,
}: {
  data: CreateSalesRefundDto;
  password: string;
  decoded: {
    userId: number;
    userRole: string;
    userFullName: string;
    empPosition: string;
    storeId: number | null;
  };
}) => {
  try {
    if (!data.salesId) {
      throw new Error("No sales ID found!");
    }
    const res = await processCreateSaleRefund({
      data: data,
      decoded: decoded,
      password,
    });
    return {
      success: true,
      message: "Sales refunded successfully!",
      data: res ?? null,
    };
  } catch (e: any) {
    return {
      success: false,
      message: e.message,
      error: e,
    };
  }
};

export const getSalesByStoreId = async ({
  storeId,
  search,
  includeSaleItems,
  customer,
  customerType,
  from,
  to,
  keyFields,
  offset,
  limit,
  method,
  noLimit,
  excludeStatus,
}: {
  storeId: number;
  search?: string;
  includeSaleItems?: boolean;
  customer?: boolean;
  customerType?: "customer" | "walk-in";
  from?: string;
  to?: string;
  keyFields?: Partial<Sales>;
  limit?: number;
  offset?: number;
  method?: string;
  noLimit?: boolean;
  excludeStatus?: string;
}) => {
  try {
    const data = await getSalesServices.getSales({
      keyFields: { storeId: storeId },
      search,
      includeSaleItems,
      customer,
      customerType,
      from,
      to,
      offset,
      limit,
      method,
      nolimit: noLimit,
      excludeStatus,
    });
    const count = await getSalesServices.getSalesCount({
      keyFields: { storeId: storeId },
      search,
      customer,
      customerType,
      from,
      to,
      excludeStatus,
    });

    return {
      success: true,
      message: "Sales fetched successfully!",
      data: data ?? null,
      count: count[0].count,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to fetched sales!",
      error: e,
    };
  }
};

export const getSales = async ({
  keyFields = {},
  search,
  storeName,
  from,
  to,
  includeSaleItems,
  customer,
  customerType,
  limit,
  offset,
  customerId,
  storeId,
  method,
  nolimit,
}: {
  keyFields?: Partial<Sales>;
  search?: string;
  storeName?: string;
  from?: string;
  to?: string;
  includeSaleItems?: boolean;
  customer?: boolean;
  customerType?: "customer" | "walk-in";
  limit?: number;
  offset?: number;
  customerId?: number;
  storeId?: number;
  method?: string;
  nolimit?: boolean;
}) => {
  try {
    const data = await getSalesServices.getSales({
      keyFields,
      search,
      storeName,
      from,
      to,
      includeSaleItems,
      customer,
      customerType,
      offset,
      limit,
      customerId,
      storeId,
      method,
      nolimit,
    });
    const count = await getSalesServices.getSalesCount({
      keyFields,
      search,
      storeName,
      from,
      to,
      storeId,
      customerId,
      customerType,
      method,
    });

    return {
      success: true,
      message: "Sales fetched successfully!",
      data: data ?? null,
      count: count[0].count,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to fetched sales!",
      error: e,
    };
  }
};

export const getSaleDashBoard = async () => {
  try {
    const data = await getDailyStoreSales();
    return {
      success: true,
      message: "Dail sales fetched successfully!",
      data: data ?? null,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to fetched daily sales!",
      error: e,
    };
  }
};
export const getSalesItemBySalesId = async (salesId: number) => {
  try {
    const data = await getSalesItemServices.findSaleItemsBySalesId({ salesId });
    return {
      success: true,
      message: "Sales Items fetched",
      data: data ?? null,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to fetched Sales Items!",
      error: e,
    };
  }
};

export const getTotalSalesDetails = async ({
  storeId,
  search,
  customer,
  customerType,
  from,
  to,
  store,
}: {
  storeId?: number;
  search?: string;
  customer?: boolean;
  customerType?: "customer" | "walk-in";
  from?: string;
  to?: string;
  store?: string;
}) => {
  try {
    const data = await getSalesServices.findSalesTotalsByStoreId({
      storeId,
      from,
      to,
      store,
      customerType,
    });
    return {
      success: true,
      message: "Sales Items fetched",
      data: data ?? null,
    };
  } catch (e) {
    console.log({ e });
    return {
      success: false,
      message: "Failed to fetched Sales Items!",
      error: e,
    };
  }
};

export const getSalesByProductVariant = async ({
  storeId,
  storeName,
  search,
  from,
  to,
  limit,
  offset,
}: {
  storeId?: number;
  storeName?: string;
  search?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}) => {
  try {
    const data = await getSalesServices.getSalesByProductVariant({
      storeId,
      storeName,
      search,
      from,
      to,
      limit,
      offset,
    });
    const count = await getSalesServices.getSalesByProductVariantCount({
      storeId,
      storeName,
      search,
      from,
      to,
    });

    return {
      success: true,
      message: "Sales by product variant fetched successfully!",
      data: data ?? null,
      count: count[0]?.count ?? 0,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to fetch sales by product variant!",
      error: e,
    };
  }
};

export const getSalesTransactionsByProductVariant = async ({
  prodVarId,
  storeId,
  storeName,
  from,
  to,
  limit,
  offset,
}: {
  prodVarId: number;
  storeId?: number;
  storeName?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}) => {
  try {
    const data = await getSalesServices.getSalesTransactionsByProductVariant({
      prodVarId,
      storeId,
      storeName,
      from,
      to,
      limit,
      offset,
    });
    const count =
      await getSalesServices.getSalesTransactionsByProductVariantCount({
        prodVarId,
        storeId,
        storeName,
        from,
        to,
      });

    return {
      success: true,
      message: "Sales transactions for product variant fetched successfully!",
      data: data ?? null,
      count: count[0]?.count ?? 0,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to fetch sales transactions for product variant!",
      error: e,
    };
  }
};
