import {
  CreateProductVariantDto,
  CreateVarianComponentDto,
} from "@/dtos/products.dto";
import {
  insertProductVariant,
  insertProductVariants,
} from "@/models/productModel";
import { PoolConnection } from "mysql2/promise";
import { createVariantComponent } from "./variant-component/create-variant-component";
import ItemMovementCard from "@/app/inventory/components/ItemMovementCard";

export async function createProductVariant({
  connection,
  data,
}: {
  connection?: PoolConnection;
  data: CreateProductVariantDto;
}) {
  try {
    await insertProductVariant({ connection, data });
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
  try {
    data.map(async (item) => {
      const prodVarId = await insertProductVariant({ connection, data: item });

      if (item.variantComponents && item.variantComponents.length > 0) {
        const varianComponents: CreateVarianComponentDto[] =
          item.variantComponents.map((vc) => ({
            ...vc,
            prodVarId: prodVarId,
          }));
        await createVariantComponent({ connection, data: varianComponents });
      }
    });
  } catch (e) {
    throw e;
  }
}
