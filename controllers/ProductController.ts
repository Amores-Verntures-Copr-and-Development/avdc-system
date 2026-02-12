import {
  CreateProductCategoryDto,
  CreateProductDtos,
  CreateProductVariantDto,
  CreateVarianComponentDto,
} from "@/dtos/products.dto";
import { updateProductVariants } from "@/models/productModel";
import {
  createBulkProducts,
  createProducts,
} from "@/services/products/create-products";
import { deleteProducts } from "@/services/products/delete-product";
import { getProducts } from "@/services/products/get-products";
import { processAddProducts } from "@/services/products/process-add-products";
import { createProductCategory } from "@/services/products/product-category/create-product-category";
import { getProductCategoryServices } from "@/services/products/product-category/get-product-category";
import {
  createProductVariant,
  createProductVariants,
} from "@/services/products/product-variant/create-product-variants";
import { deleteProductVariants } from "@/services/products/product-variant/delete-product-variants";
import { getProductVariants } from "@/services/products/product-variant/get-product-variants";
import { updateProductVariantServices } from "@/services/products/product-variant/update-product-variants";
import { createVariantComponent } from "@/services/products/product-variant/variant-component/create-variant-component";
import { deleteVariantComponentServices } from "@/services/products/product-variant/variant-component/delete-variant-components";
import { updateVariantComponentServices } from "@/services/products/product-variant/variant-component/update-variant-component";
import { updateProductsByFields } from "@/services/products/udpate-product";
import {
  ProductCategories,
  Products,
  ProductVariants,
  VariantComponents,
} from "@/types/products";

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

export const createProductBulkController = async (
  data: CreateProductDtos[],
) => {
  try {
    const res = await createBulkProducts({ data });
    return {
      data: res,
      success: true,
      message: "Products added successfully!",
    };
  } catch (e) {
    console.error(e);
    return {
      success: false,
      message: "Failed to add products!",
      error: e,
    };
  }
};

export const createProductVariantController = async (
  data: CreateProductVariantDto,
) => {
  try {
    const res = await createProductVariant({ data });
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

export const createProductVariantBulkController = async (
  data: CreateProductVariantDto[],
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
  data: CreateVarianComponentDto[],
) => {
  try {
    const res = await createVariantComponent({ data: data });
    return {
      data: res,
      success: true,
      message: "Variant added successfully!",
    };
  } catch (e) {
    console.log(e);
    return {
      success: false,
      message: "Failed to add variant!",
      error: e,
    };
  }
};

export const getProduct = async ({
  search,
  storeName,
  keyFields = {},
}: {
  storeId?: number;
  search?: string;
  storeName?: string;
  keyFields?: Partial<Products>;
}) => {
  try {
    const data = await getProducts({
      keyFields,
      search,
      storeName,
    });
    return {
      data: data,
      message: "Product fetched successfully!",
      success: true,
    };
  } catch (e) {
    console.error(e);
    return {
      error: e,
      message: "Failed to fetched product!",
      success: false,
    };
  }
};

export const updateProductById = async (product: Partial<Products>) => {
  try {
    const res = await updateProductsByFields({
      keyFields: ["prodId"],
      updates: [product],
    });
    return {
      data: res,
      message: "Product updated successfully!",
      success: true,
    };
  } catch (e) {
    return {
      error: e,
      message: "Failed to update product!",
      success: false,
    };
  }
};

export const deleteProductController = async (product: Partial<Products>) => {
  try {
    const res = await deleteProducts({
      keyFields: ["prodId"],
      updates: [product],
    });
    return {
      data: res,
      message: "Product deleted successfully!",
      success: true,
    };
  } catch (e) {
    return {
      error: e,
      message: "Failed to deleted product!",
      success: false,
    };
  }
};

export const deleteProductVariantController = async (
  productVariants: Partial<ProductVariants>,
) => {
  try {
    const res = await deleteProductVariants({
      keyFields: ["prodVarId"],
      updates: [productVariants],
    });
    return {
      data: res,
      message: "Product Variant deleted successfully!",
      success: true,
    };
  } catch (e) {
    return {
      error: e,
      message: "Failed to deleted product variant!",
      success: false,
    };
  }
};

export const getProductVariantController = async ({
  keyFields = {},
  search,
  statusSold,
  from,
  to,
}: {
  keyFields?: Partial<ProductVariants>;
  search?: string;
  statusSold?: "fast" | "slow";
  from?: string;
  to?: string;
}) => {
  try {
    const data = await getProductVariants({
      keyFields,
      search,
      statusSold,
      from,
      to,
    });
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

export const createProductCategories = async (
  data: CreateProductCategoryDto[],
) => {
  try {
    const result = await createProductCategory({ data });
    return {
      data: result,
      message: "Product Category added successfully!",
      success: true,
    };
  } catch (e) {
    console.log(e);
    return {
      error: e,
      message: "Failed to add product category!",
      success: false,
    };
  }
};

export const getProductCategories = async ({
  keyFields = {},
}: {
  keyFields?: Partial<ProductCategories>;
}) => {
  try {
    const data = await getProductCategoryServices.findProductCategoriesByFields(
      { keyFields },
    );
    return {
      data: data,
      message: "Product variants fetched successfully!",
      success: true,
    };
  } catch (e) {
    console.log(e);
    return {
      error: e,
      message: "Failed to fetched product variants!",
      success: false,
    };
  }
};

export const updateProductVariantController = async (
  data: Partial<ProductVariants>,
) => {
  try {
    const result = await updateProductVariantServices.updateProductVariants({
      updates: [data],
    });
    return {
      data: result,
      message: "Product variants updated successfully!",
      success: true,
    };
  } catch (e) {
    return {
      error: e,
      message: "Failed to update product variants!",
      success: false,
    };
  }
};

export const updateVariantComponentController = async (
  data: Partial<VariantComponents>[],
) => {
  try {
    const result =
      await updateVariantComponentServices.updateVariantComponentByFields({
        updates: data,
      });
    return {
      data: result,
      message: "Variants component updated successfully!",
      success: true,
    };
  } catch (e) {
    return {
      error: e,
      message: "Failed to update variant components!",
      success: false,
    };
  }
};

export const hardDeleteVariantComponentController = async (
  data: Partial<VariantComponents>[],
) => {
  try {
    const result =
      await deleteVariantComponentServices.hardDeleteVariantComponent({
        updates: data,
      });
    return {
      data: result,
      message: "Variants component deleted successfully!",
      success: true,
    };
  } catch (e) {
    return {
      error: e,
      message: "Failed to delete variant components!",
      success: false,
    };
  }
};
