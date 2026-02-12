import { CreateOrderCompositeItemDro } from "@/dtos/purchase.dto";
import { getDBConnection } from "@/lib/db";
import { insertOrderCompositeItem } from "@/models/orderCompositeItemModel";
import { PoolConnection } from "mysql2/promise";
import { handleUpdateItemPrice } from "../items/update-items";
import { ItemInterface } from "@/types/items";
import { getItemByFields } from "@/controllers/ItemController";
import { findItemsByFields } from "../items/get-item";
import { getOrderCompositeServices } from "./get-order-composite";
import { OrderCompositeItem } from "@/types/purchaseOrders";
import { findPOItemsById } from "../purchaseOrderServices";
import { findPurchaserOrder } from "../purchase/purchase-items/get-purchase-tems";
import { updatePurchase } from "../purchase/update-purchase-order";
import { updatePurchaseOrderItems } from "../purchase/purchase-items/update-purchase-items";

export async function createOrderCompositeItems({
  connection,
  data,
}: {
  connection?: PoolConnection;
  data: CreateOrderCompositeItemDro[];
}) {
  let localConnection = false;
  let newConnection: any;
  if (!connection) {
    localConnection = true;
    const newPool = await getDBConnection();
    newConnection = await newPool.getConnection();
    await newConnection.beginTransaction();
  }
  try {
    const ids = await insertOrderCompositeItem({
      connection: connection ? connection : newConnection,
      data,
    });

    const hasPricesData = data.filter((i) => Number(i.ordComPrice) !== 0);

    if (hasPricesData && hasPricesData.length > 0) {
      const updateItemPrice: Partial<ItemInterface>[] = hasPricesData.map(
        (item) => ({
          itemId: item.itemId,
          itemPrice: item.ordComPrice,
          itemAddedBy: item.ordComCreatedBy,
        }),
      );
      //update the price first
      await handleUpdateItemPrice({
        connection: connection ? connection : newConnection,
        keyFields: ["itemId"],
        updates: updateItemPrice,
      });
      //get all items first
      const compositeItems =
        (await getOrderCompositeServices.findOrderCompositeByPOId({
          connection: connection ? connection : newConnection,
          poItemId: hasPricesData[0].poItemId!,
        })) as OrderCompositeItem[];
      console.log({ compositeItems });
      const validItems = compositeItems.filter((i) => i.ordComPrice !== 0);

      const totalPrice = validItems.reduce((sum, item) => {
        return sum + Number(item.ordComPrice);
      }, 0);
      const itemQty = validItems.length;

      const averageCompositedPrice = Number(totalPrice) / Number(itemQty);
      const rounded = Number(averageCompositedPrice.toFixed(2));

      const fromCompositeItems = await findPurchaserOrder({
        connection: connection ? connection : newConnection,
        keyfields: { poItemId: hasPricesData[0].poItemId! },
      });

      if (fromCompositeItems && fromCompositeItems.length > 0) {
        const updateFromComposte: Partial<ItemInterface> = {
          itemAddedBy: hasPricesData[0].ordComCreatedBy,
          itemId: fromCompositeItems[0].itemId,
          itemPrice: rounded,
        };
        await handleUpdateItemPrice({
          connection: connection ? connection : newConnection,
          keyFields: ["itemId"],
          updates: [updateFromComposte],
        });
        await updatePurchaseOrderItems({
          connection: connection ? connection : newConnection,
          updates: [
            {
              poItemId: hasPricesData[0].poItemId!,
              unitPrice: Number(rounded),
            },
          ],
        });
      }
    }
    if (localConnection) {
      await newConnection.commit();
    }
    return ids;
  } catch (e) {
    if (localConnection) {
      await newConnection.rollback();
    }
    throw e;
  } finally {
    // Optional: close connection if it was created here
    if (localConnection) {
      await newConnection.release();
    }
  }
}
