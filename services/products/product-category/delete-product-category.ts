import { getProduct } from "@/controllers/ProductController";
import { getDBConnection } from "@/lib/db";
import {
  selectProductModelOnly,
  updateProductCategories,
} from "@/models/productModel";
import { ProductCategories, Products } from "@/types/products";
import { PoolConnection } from "mysql2/promise";
import { updateProductsByFields } from "../udpate-product";

export async function deleteProductCategoriesByFields({
  connection,
  updates,
  keyFields = ["prodCatId"],
}: {
  connection?: PoolConnection;
  updates: Partial<ProductCategories>[];
  keyFields?: (keyof ProductCategories)[];
}) {
  let localConnection = false;
  let newConnection: PoolConnection | undefined;

  if (!connection) {
    localConnection = true;
    const newPool = await getDBConnection();
    newConnection = await newPool.getConnection();
    await newConnection.beginTransaction();
  }

  try {
    const dbConnection = connection ?? newConnection;

    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    const deleteData: Partial<ProductCategories>[] = updates.map((cat) => ({
      ...cat,
      prodCatDeletedAt: now,
    }));

    // ✅ Properly await all product queries
    const productPromises = deleteData.map(async (cat) => {
      const product = await selectProductModelOnly({
        keyFields: { prodCatId: cat.prodCatId },
        connection: dbConnection,
      });
      return product;
    });

    const productResults = await Promise.all(productPromises);

    // Flatten the array and filter out undefined
    const products: Products[] = productResults.filter(Boolean).flat();

    if (products.length > 0) {
      const updateProductToNullCategory: Partial<Products>[] = products.map(
        (p) => ({
          prodId: p.prodId,
          prodCatId: null,
        }),
      );

      await updateProductsByFields({
        connection: dbConnection,
        updates: updateProductToNullCategory,
        keyFields: ["prodId"],
      });
    }

    const res = await updateProductCategories({
      connection: dbConnection,
      updates: deleteData,
      keyFields,
    });

    if (localConnection) {
      await newConnection!.commit();
    }

    return res;
  } catch (e) {
    if (localConnection) {
      await newConnection!.rollback();
    }
    throw e;
  } finally {
    if (localConnection) {
      newConnection!.release();
    }
  }
}
