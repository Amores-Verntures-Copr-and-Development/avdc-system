import { selectProductVariantStoreId } from "@/models/productModel";
import { selectInventoryItemStoreId } from "@/models/inventoryModels";

// assertStoreAccess only proves the acting user may act on `storeId` - it
// says nothing about whether the prodVarId a route also received (from the
// URL or the request body) actually belongs to that store. Without this
// check, a valid user of one store could read/replace/delete another
// store's product variant (including its uploaded image) just by supplying
// a different prodVarId.
export async function assertProductVariantBelongsToStore(
  prodVarId: number,
  storeId: number,
) {
  const actualStoreId = await selectProductVariantStoreId(prodVarId);
  if (actualStoreId === null || actualStoreId !== storeId) {
    throw new Error("This product variant does not belong to this store");
  }
}

// Same reasoning, for the inventoryItemId a request wants to link a
// variant to - without this, a variant could be pointed at another store's
// inventory item, so future sales would decrement the wrong store's stock.
export async function assertInventoryItemBelongsToStore(
  inventoryItemId: number,
  storeId: number,
) {
  const actualStoreId = await selectInventoryItemStoreId(inventoryItemId);
  if (actualStoreId === null || actualStoreId !== storeId) {
    throw new Error("This inventory item does not belong to this store");
  }
}
