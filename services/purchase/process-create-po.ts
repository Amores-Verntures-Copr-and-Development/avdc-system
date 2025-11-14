import {
  CreatePurchaseOrderDto,
  CreatePurchaseOrderFormDto,
  CreatePurchaseOrderItemDto,
  CreatePurchaseOrderRequestDto,
} from "@/dtos/purchase.dto";
import { getDBConnection } from "@/lib/db";
import {
  insertPurchaseOrder,
  insertPurchaseOrderItems,
  insertPurchaseOrderRequest,
  selectCountPurchaseOrder,
} from "@/models/purchaseOrderModel";
import { updateRequests } from "../request/update-request";
import { Request } from "@/types/request";

export async function processCreatePO(data: CreatePurchaseOrderFormDto) {
  const pool = await getDBConnection();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const poRows = await selectCountPurchaseOrder({ connection });
    const generateId = `PO-${(poRows.total + 1).toString().padStart(3, "0")}`;
    const purhcaseOrderData: CreatePurchaseOrderDto = {
      ...data,
      poNumber: generateId,
    };
    const purchaseOrderId = await insertPurchaseOrder({
      connection,
      data: purhcaseOrderData,
    });

    const purchaseOrderRequestData: CreatePurchaseOrderRequestDto[] =
      data.purchaseOrderRequest.map((request) => ({
        poId: purchaseOrderId,
        requestId: request.requestId,
      }));
    await insertPurchaseOrderRequest({
      connection,
      data: purchaseOrderRequestData,
    });
    const purchaseOrderItems: CreatePurchaseOrderItemDto[] =
      data.purchaseOrderItems.map((item) => ({
        ...item,
        poId: purchaseOrderId,
      }));
    await insertPurchaseOrderItems({ connection, data: purchaseOrderItems });
    const requestData: Partial<Request>[] = data.purchaseOrderRequest.map(
      (req) => ({
        requestId: req.requestId,
        requestStatus: "in_progress",
      })
    );
    await updateRequests({
      connection,
      keyFields: ["requestId"],
      updates: requestData,
    });
    await connection.commit();
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}
