import { updateSupplierItemsByFields } from "@/models/supplierModels";
import { SupplierItem } from "@/types/supplier";
import { PoolConnection } from "mysql2/promise";
import { createSupplierItemPrices } from "./supplier-item-price/create-supplier-item-price";
import { CreateSupplierItemPriceDto } from "@/dtos/supplier.dto";
import { getSupplierItem } from "./get-supplier-item";

export async function handleDeleteSupplierItems(data: Partial<SupplierItem>[]) {
  const deletedData: Partial<SupplierItem>[] = data.map((item) => ({
    suppItemId: item.suppItemId,
    suppItemStatus: "deleted",
  }));
  try {
    const result = await updateSupplierItemsByFields({
      keyFields: ["suppItemId"],
      data: deletedData,
    });
    return result;
  } catch (e) {
    throw e;
  }
}

export async function updateSupplierItems({
  connection,
  updates,
  keyFields = ["suppItemId"],
}: //   fieldModes = {}, // default primary key
{
  connection?: PoolConnection;
  updates: Partial<SupplierItem>[];
  keyFields?: (keyof SupplierItem)[];
  //   fieldModes?: Partial<Record<keyof RequestItems, any>>;
}) {
  try {
    const result = await updateSupplierItemsByFields({
      connection,
      keyFields: keyFields,
      data: updates,
    });
    return result;
  } catch (e) {
    throw e;
  }
}

export async function handleUpdateSupplierItemPrice({
  connection,
  updates,
  keyFields = ["suppItemId"],
}: {
  connection?: PoolConnection;
  updates: Partial<SupplierItem>[];
  keyFields?: (keyof SupplierItem)[];
}) {
  try {
    console.log({ updates });

    const result = await updateSupplierItemsByFields({
      connection,
      keyFields: keyFields,
      data: updates,
    });
    const hasSuppItemId = updates.every((item) => item.suppItemId);

    if (hasSuppItemId) {
      console.log(`hasSuppItemId: `, { hasSuppItemId });
      const itemPrices: CreateSupplierItemPriceDto[] = updates
        .filter(
          (item) =>
            item.suppItemId !== undefined &&
            item.suppItemPrice !== undefined &&
            item.suppItemCreatedBy !== undefined
        )
        .map((item) => ({
          suppItemId: item.suppItemId!,
          sipAmount: item.suppItemPrice!,
          sipCreatedBy: item.suppItemCreatedBy!,
        }));

      // Use itemPrices instead of data
      await createSupplierItemPrices({ connection, data: itemPrices });
    } else {
      const itemPricesPromises = updates.map(async (item) => {
        const suppItem = await getSupplierItem({
          connection,
          keyfields: { suppId: item.suppId, itemId: item.itemId },
        });
        return {
          suppItemId: suppItem[0].suppItemId,
          sipAmount: item.suppItemPrice!,
          sipCreatedBy: item.suppItemCreatedBy!,
        };
      });

      // Wait for all promises to resolve
      const itemPrices: CreateSupplierItemPriceDto[] = await Promise.all(
        itemPricesPromises
      );
      console.log({ itemPrices });
      // Now use itemPrices
      await createSupplierItemPrices({ connection, data: itemPrices });
    }

    return result;
  } catch (e) {
    throw e;
  }
}
