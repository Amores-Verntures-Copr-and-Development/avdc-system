import {
  CreateProductDtos,
  CreateProductVariantDto,
  CreateVarianComponentDto,
} from "@/dtos/products.dto";
import { createProducts } from "@/services/products/create-products";
import { getProducts } from "@/services/products/get-products";
import { processAddProducts } from "@/services/products/process-add-products";
import { createProductVariants } from "@/services/products/product-variant/create-product-variants";
import { getProductVariants } from "@/services/products/product-variant/get-product-variants";
import { ProductVariants } from "@/types/products";

export const createProductController = async (data: CreateProductDtos) => {
  try {
    const res = await createProducts({ data });
    return {
      data: res,
      success: true,
      message: "Product added successfully!",
    };
  } catch (e) {
    console.error(e);
    return {
      success: false,
      message: "Failed to add product!",
      error: e,
    };
  }
};

export const createProductVariantController = async (
  data: CreateProductVariantDto
) => {
  try {
    const res = await createProductVariants({ data });
    return {
      data: res,
      success: true,
      message: "Product variant added successfully!",
    };
  } catch (e) {
    console.error(e);
    return {
      success: false,
      message: "Failed to add product variant!",
      error: e,
    };
  }
};

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

export const getProductVariantController = async ({
  keyFields = {},
}: {
  keyFields?: Partial<ProductVariants>;
}) => {
  try {
    const data = await getProductVariants({ keyFields });
    return {
      data: data,
      message: "Product variants fetched successfully!",
      success: true,
    };
  } catch (e) {
    return {
      error: e,
      message: "Failed to fetched product variants!",
      success: false,
    };
  }
};
