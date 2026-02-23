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
import { findRequestItemsByPoItemIdWithConverions } from "../request/request-items/get-request-items";
import { updateRequestItems } from "../request/request-items/update-request-items";
import { RequestItems } from "@/types/request";

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
    console.log({ data });
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
      const compositeItems =
        (await getOrderCompositeServices.findOrderCompositeByPOId({
          connection: connection ? connection : newConnection,
          poItemId: hasPricesData[0].poItemId!,
        })) as OrderCompositeItem[];
      const validItems = compositeItems.filter((i) => i.ordComPrice !== 0);
      const totalAmount = validItems.reduce((sum, item) => {
        return sum + Number(item.ordComPrice) * Number(item.ordComQuantity);
      }, 0);
      const totalQuantity = validItems.reduce((sum, item) => {
        return sum + Number(item.ordComQuantity);
      }, 0);
      const averagePrice = totalQuantity > 0 ? totalAmount / totalQuantity : 0;
      const rounded = Number(averagePrice);

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
        const checkRequestItems =
          await findRequestItemsByPoItemIdWithConverions({
            connection: connection ? connection : newConnection,
            poItemId: hasPricesData[0].poItemId!,
          });
        let updateRequest: Partial<RequestItems>[] = [];
        if (checkRequestItems && checkRequestItems.length > 0) {
          for (const req of checkRequestItems) {
            if (!req.itemConId) {
              updateRequest.push({
                reqItemId: req.reqItemId,
                unitPrice: averagePrice,
              });
            }
          }
        }
        if (updateRequest && updateRequest.length) {
          console.log({ updateRequest });
          await updateRequestItems({
            connection,
            updates: updateRequest,
            keyFields: ["reqItemId"],
          });
        }
        //Find and update the unit price of requestItems too
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
