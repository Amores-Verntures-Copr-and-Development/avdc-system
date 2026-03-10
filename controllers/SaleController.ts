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
  from,
  to,
  keyFields,
}: {
  storeId: number;
  search?: string;
  includeSaleItems?: boolean;
  customer?: boolean;
  from?: string;
  to?: string;
  keyFields?: Partial<Sales>;
}) => {
  try {
    const data = await getSalesServices.getSales({
      keyFields: { storeId: storeId },
      search,
      includeSaleItems,
      customer,
      from,
      to,
    });
    return {
      success: true,
      message: "Sales fetched successfully!",
      data: data ?? null,
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
}: {
  keyFields?: Partial<Sales>;
  search?: string;
  storeName?: string;
  from?: string;
  to?: string;
  includeSaleItems?: boolean;
  customer?: boolean;
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
    });
    return {
      success: true,
      message: "Sales fetched successfully!",
      data: data ?? null,
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
  from,
  to,
  store,
}: {
  storeId?: number;
  search?: string;
  customer?: boolean;
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
    });
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
