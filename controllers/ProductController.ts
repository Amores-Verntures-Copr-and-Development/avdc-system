import {
  CreateProductDtos,
  CreateProductVariantDto,
  CreateVarianComponentDto,
} from "@/dtos/products.dto";
import { createProducts } from "@/services/products/create-products";
import { getProducts } from "@/services/products/get-products";
import { processAddProducts } from "@/services/products/process-add-products";

export const createProductController = async (data: CreateProductDtos) => {
  try {
    const res = await createProducts({ data });
    return {
      data: res,
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

export const createProductVariantController = async (
  data: CreateProductVariantDto
) => {};

export const createVariantComponentController = async (
  data: CreateVarianComponentDto
) => {};

export const getProduct = async ({
  storeId,
}: {
  storeId?: number;
  search?: String;
}) => {
  try {
    const data = await getProducts({ keyFields: { storeId } });
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
