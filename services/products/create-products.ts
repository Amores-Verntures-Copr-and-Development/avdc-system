import {
  CreateProductDtos,
  CreateProductVariantDto,
  CreateVarianComponentDto,
} from "@/dtos/products.dto";
import { getDBConnection } from "@/lib/db";
import {
  insertProducts,
  insertProductsBulk,
  insertProductVariantsBulk,
  selectProducts,
} from "@/models/productModel";
import { PoolConnection } from "mysql2/promise";
import { createProductVariantsBulk } from "./product-variant/create-product-variants";
import { createVariantComponent } from "./product-variant/variant-component/create-variant-component";
import { getProductVariants } from "./product-variant/get-product-variants";

export async function createProducts({
  connection,
  data,
}: {
  connection?: PoolConnection;
  data: CreateProductDtos;
}) {
  try {
    //check if product with same name exists in the same category for the store

    const isExistingProducts = await selectProducts({
      keyFields: {
        prodName: data.prodName,
        storeId: data.storeId,
      },
      connection,
    });

    if (isExistingProducts.length > 0) {
      throw new Error(
        "A product with the same name already exists in this category for the store.",
      );
    }

    const id = await insertProducts({ connection, data });

    if (data.productVariants?.length) {
      await insertProductVariantsBulk({
        connection,
        data: data.productVariants.map((variant) => ({
          ...variant,
          prodId: id,
        })),
      });
    }

    return id;
  } catch (e) {
    throw e;
  }
}

export async function createBulkProducts({
  data,
}: {
  data: CreateProductDtos[];
}) {
  const pool = await getDBConnection();
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  console.log(data[0].productVariants);
  try {
    const validProducts: CreateProductDtos[] = [];
    const skippedProducts: string[] = [];
    const validVariants: CreateProductVariantDto[] = [];
    for (const product of data) {
      const isExistingProducts = await selectProducts({
        keyFields: {
          prodName: product.prodName,
          storeId: product.storeId,
        },
        connection,
      });

      if (isExistingProducts.length > 0) {
        skippedProducts.push(product.prodName);
        continue;
      }

      validProducts.push(product);
    }

    if (validProducts.length === 0) {
      throw new Error(
        `All products already exist: ${skippedProducts.join(", ")}`,
      );
    }

    const productData: CreateProductDtos[] = validProducts.map((p) => ({
      prodCatId: p.prodCatId,
      prodCreatedBy: p.prodCreatedBy,
      prodName: p.prodName,
      storeId: p.storeId,
    }));

    const prodIds: number[] = await insertProductsBulk({
      connection,
      data: productData,
    });

    const allVariants: CreateProductVariantDto[] = [];

    validProducts.forEach((product, index) => {
      const prodId = prodIds[index];

      product.productVariants?.forEach((pv) => {
        allVariants.push({
          prodId,
          prodVarCreatedBy: pv.prodVarCreatedBy,
          prodVarName: pv.prodVarName,
          prodVarPrice: Number(pv.prodVarPrice),
          prodVarUnit: pv.prodVarUnit,
          isDeductInv: pv.isDeductInv,
          inventoryItemId: pv.inventoryItemId,
        });
      });
    });

    for (const variant of allVariants) {
      const isExistingVariants = await getProductVariants({
        keyFields: {
          inventoryItemId: variant.inventoryItemId,
          prodId: variant.prodId,
        },
      });

      if (isExistingVariants.data.length > 0) {
        continue;
      }

      validVariants.push(variant);
    }

    if (validVariants.length) {
      await insertProductVariantsBulk({
        connection: connection,
        data: validVariants,
      });
    }
    await connection.commit();

    return {
      inserted: validProducts.length,
      skipped: skippedProducts,
      message:
        skippedProducts.length > 0
          ? `Products created. Skipped existing products: ${skippedProducts.join(", ")}`
          : "Products created successfully.",
    };
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}
