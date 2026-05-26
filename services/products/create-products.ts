import {
  CreateProductDtos,
  CreateProductVariantDto,
  CreateVarianComponentDto,
} from "@/dtos/products.dto";
import { getDBConnection } from "@/lib/db";
import {
  insertProducts,
  insertProductsBulk,
  selectProducts,
} from "@/models/productModel";
import { PoolConnection } from "mysql2/promise";
import { createProductVariantsBulk } from "./product-variant/create-product-variants";
import { createVariantComponent } from "./product-variant/variant-component/create-variant-component";

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

  try {
    const validProducts: CreateProductDtos[] = [];
    const skippedProducts: string[] = [];

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
        });
      });
    });

    const variantIds = await createProductVariantsBulk({
      connection,
      data: allVariants,
    });

    const allVariantComponents: CreateVarianComponentDto[] = [];
    let variantIndex = 0;

    validProducts.forEach((product) => {
      product.productVariants?.forEach((pv) => {
        const prodVarId = variantIds[variantIndex++];

        pv.variantComponents?.forEach((vc) => {
          allVariantComponents.push({
            prodVarId,
            inventoryItemId: vc.inventoryItemId,
            quantityRequired: Number(vc.quantityRequired),
            isDeductVar: vc.isDeductVar,
          });
        });
      });
    });

    if (allVariantComponents.length) {
      await createVariantComponent({
        connection,
        data: allVariantComponents,
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
