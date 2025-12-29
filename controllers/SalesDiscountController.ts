import { CreateSalesDiscountDto } from "@/dtos/discounts.dto";
import { createSalesDiscountServices } from "@/services/saes-discounts/create-sales-discounts";
import { getSalesDiscountServices } from "@/services/saes-discounts/get-sales-discounts";

export const createSalesDiscounts = async (data: CreateSalesDiscountDto) => {
  try {
    const result = await createSalesDiscountServices.createSalesDiscount({
      data,
    });
    return {
      data: result,
      success: true,
      message: "Sales Discount created successfully!",
    };
  } catch (e) {
    console.error(e);
    return {
      success: false,
      message: "Failed to create sales discount !",
      error: e,
    };
  }
};

export const getSalesDiscountByStore = async (id: number) => {
  try {
    const data = await getSalesDiscountServices.findSalesDiscountByStoreId({
      storeId: id,
    });
    return {
      data: data,
      success: true,
      message: "Sales Discount fetched successfully!",
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to fetch sales discount!",
      error: e,
    };
  }
};
