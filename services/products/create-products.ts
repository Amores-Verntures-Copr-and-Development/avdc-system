import {
  CreateProductDtos,
  CreateProductVariantDto,
  CreateVarianComponentDto,
} from "@/dtos/products.dto";
import { getDBConnection } from "@/lib/db";
import { insertProducts, insertProductsBulk } from "@/models/productModel";
import { PoolConnection } from "mysql2/promise";
import {
  createProductVariant,
  createProductVariantsBulk,
} from "./product-variant/create-product-variants";
import { createVariantComponent } from "./product-variant/variant-component/create-variant-component";

export async function createProducts({
  connection,
  data,
}: {
  connection?: PoolConnection;
  data: CreateProductDtos;
}) {
  try {
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
    const productData: CreateProductDtos[] = data.map((p) => ({
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
    data.forEach((product, index) => {
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
    console.log({ allVariants });
    const variantIds = await createProductVariantsBulk({
      connection,
      data: allVariants,
    });
    const allVariantComponents: CreateVarianComponentDto[] = [];
    let variantIndex = 0;

    data.forEach((product) => {
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
    console.log({ variantIds, allVariantComponents });
    if (allVariantComponents.length) {
      await createVariantComponent({
        connection,
        data: allVariantComponents,
      });
    }

    await connection.commit();
  } catch (e) {
    console.log({ e });
    // Rollback transaction safely
    await connection.rollback();
    throw e;
  } finally {
    // Always release the connection
    connection.release();
  }
}
