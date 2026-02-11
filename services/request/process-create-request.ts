import {
  CreateRequestDto,
  CreateRequestFormDto,
  CreateRequestItemDto,
} from "@/dtos/request.dto";
import { getDBConnection } from "@/lib/db";
import { createRequest } from "./create-request";
import { selectCountRequest } from "@/models/requestModel";
import { createRequestItem } from "./request-items/create-request-items";

export async function processCreateRequest(data: CreateRequestFormDto) {
  const pool = await getDBConnection();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const requestRows = await selectCountRequest({ connection });
    const generateId = `REQ-${(requestRows.total + 1)
      .toString()
      .padStart(3, "0")}`;
    const requestData: CreateRequestDto = {
      requestById: data.requestById,
      requestNo: generateId,
      storeId: data.storeId,
    };
    const requestId = await createRequest({ connection, data: requestData });
    const requestItemData: CreateRequestItemDto[] = data.items.map((item) => ({
      reqItemQuantity: item.reqItemQuantity,
      invItem: item.invItem,
      requestId: requestId,
      reqItemStatus: "pending",
    }));
    await createRequestItem({ connection, data: requestItemData });
    await connection.commit();
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}
