import { CreateProductDtos } from "@/dtos/products.dto";
import { getProducts } from "@/services/products/get-products";
import { processAddProducts } from "@/services/products/process-add-products";

export const createProducts = async (data: CreateProductDtos[]) => {
  try {
    await processAddProducts(data);
    return {
      success: true,
      message: "Product added successfully!",
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to add product!",
      error: e,
    };
  }
};

export const getProduct = async ({
  inventoryId,
}: {
  inventoryId?: number;
  search?: String;
}) => {
  try {
    const data = await getProducts({ keyFields: { inventoryId } });
    return {
      data: data,
      message: "Product fetched successfully!",
      success: true,
    };
  } catch (e) {
    return {
      error: e,
      message: "Failed to fetched product!",
      success: false,
    };
  }
};
