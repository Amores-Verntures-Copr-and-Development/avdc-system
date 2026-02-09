import { StoreSupplierDetails } from "@/app/purchase-orders/components/ApprovedPOView";
import {
  selectPurchaserOrderItems,
  selectStoreItemsBySupplierAndPOId,
  selectStoreItemsBySupplierAndPOIdConversion,
} from "@/models/purchaseOrderModel";
import { PurchaseOrderItems } from "@/types/purchaseOrders";
import { PoolConnection } from "mysql2/promise";

export async function findStoreItemsBySupplierAndPOIds({
  connection,
  suppId,
  poId,
}: {
  connection?: PoolConnection;
  poId: number;
  suppId: number;
}) {
  try {
    const data = await selectStoreItemsBySupplierAndPOId({
      connection,
      suppId,
      poId,
    });

    const converted = await selectStoreItemsBySupplierAndPOIdConversion({
      connection,
      suppId,
      poId,
    });

    if (converted && converted.length > 0) {
      const details: StoreSupplierDetails[] = data.map((store) => {
        // Find all converted items for this store
        const convertedItemsForStore = converted.filter(
          (c) => c.storeId === store.storeId,
        );
        const notExistingInFirst = convertedItemsForStore.filter((item) =>
          store.items.some((po) => po.reqItemId !== Number(item.reqItemId)),
        );
        return {
          ...store,
          // Merge items arrays: original items + converted items
          items: [...(store.items || []), ...notExistingInFirst],
        };
      });

      return details;
    }
    //try search for
    return data;
  } catch (e) {
    throw e;
  }
}

export async function findPurchaserOrder({
  connection,
  keyfields,
}: {
  connection?: PoolConnection;
  keyfields: Partial<PurchaseOrderItems>;
}) {
  try {
    const data = await selectPurchaserOrderItems({ connection, keyfields });
    return data;
  } catch (e) {
    throw e;
  }
}
