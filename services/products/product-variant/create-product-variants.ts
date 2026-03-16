import {
  CreateProductVariantDto,
  CreateVarianComponentDto,
} from "@/dtos/products.dto";
import {
  insertProductVariant,
  insertProductVariantsBulk,
} from "@/models/productModel";
import { PoolConnection } from "mysql2/promise";
import { createVariantComponent } from "./variant-component/create-variant-component";
import ItemMovementCard from "@/app/inventory/components/ItemMovementCard";
import { getDBConnection } from "@/lib/db";

export async function createProductVariant({
  connection,
  data,
}: {
  connection?: PoolConnection;
  data: CreateProductVariantDto;
}) {
  try {
    const id = await insertProductVariant({ connection, data });
    return id;
  } catch (e) {
    throw e;
  }
}

export async function createProductVariants({
  connection,
  data,
}: {
  connection?: PoolConnection;
  data: CreateProductVariantDto[];
}) {
  let localConnection = false;
  let newConnection: any;
  try {
    // If no connection is passed, start a transaction
    if (!connection) {
      localConnection = true;
      const newPool = await getDBConnection();
      newConnection = await newPool.getConnection();
      await newConnection.beginTransaction();
    }

    // Use for...of instead of map to properly await async operations
    for (const item of data) {
      const prodVarId = await insertProductVariant({
        connection: connection ? connection : newConnection,
        data: { ...item, isDeductInv: true },
      });
      console.log(item.variantComponents);
      if (item.variantComponents && item.variantComponents.length > 0) {
        const variantComponents: CreateVarianComponentDto[] =
          item.variantComponents.map((vc) => ({ ...vc, prodVarId }));

        await createVariantComponent({
          connection: connection ? connection : newConnection,
          data: variantComponents,
        });
      }
    }

    // Commit transaction if we started it
    if (localConnection) {
      await newConnection.commit();
    }
  } catch (e) {
    // Rollback if we started transaction
    if (localConnection) {
      await newConnection.rollback();
    }
    throw e;
  } finally {
    // Release local connection if we created it
    if (localConnection) {
      await newConnection.release();
    }
  }
}

export async function createProductVariantsBulk({
  connection,
  data,
}: {
  connection?: PoolConnection;
  data: CreateProductVariantDto[];
}) {
  try {
    const ids: number[] = await insertProductVariantsBulk({
      connection,
      data,
    });

    return ids;
  } catch (e) {
    throw e;
  }
}
