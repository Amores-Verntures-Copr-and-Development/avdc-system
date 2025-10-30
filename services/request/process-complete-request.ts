import { Request } from "@/types/request";
import { updateRequests } from "./update-request";
import { getDBConnection } from "@/lib/db";

export async function processCompleteRequest(data: Request[]) {
  const pool = await getDBConnection();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const request: Partial<Request>[] = data.map((req) => ({
      requestId: req.requestId,
      requestStatus: "completed",
    }));
    await updateRequests({
      connection,
      keyFields: ["requestId"],
      updates: request,
    });
    await connection.commit();
    //Get Item inventory before this request is received then make the received as In in inventory
    //Generate Inventory Report
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}
