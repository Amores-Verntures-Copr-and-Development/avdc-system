import { CreateSaleDto } from "@/dtos/sales.dto";
import {
  getDailyStoreSales,
  getSalesServices,
} from "@/services/sales/get-sales";
import { processCreateSales } from "@/services/sales/process-create-sales";
import { getSalesItemServices } from "@/services/sales/sale-items/get-sale-items";
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

export const getSalesByStoreId = async ({
  storeId,
  search,
}: {
  storeId: number;
  search?: string;
}) => {
  try {
    const data = await getSalesServices.getSales({
      keyFields: { storeId: storeId },
      search,
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
}: {
  keyFields?: Partial<Sales>;
  search?: string;
  storeName?: string;
  from?: string;
  to?: string;
}) => {
  try {
    const data = await getSalesServices.getSales({
      keyFields,
      search,
      storeName,
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

export const getTotalSalesDetails = async (storeId: number) => {
  try {
    const data = await getSalesServices.findSalesTotalsByStoreId({ storeId });
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
