import { getDBConnection } from "@/lib/db";
import { SalesStatus } from "@/types/sales";
import { getSalesServices } from "./get-sales";
import { updateSalesByFields } from "./update-sales";

// Rejecting a pending_approval sale never had inventory/transaction/email
// side effects to begin with - process-create-sales.ts already skipped
// those for it - so this is just a status flip, unlike processApprovedSale.
// Reuses salesApprovedBy/salesApprovedAt as "who/when a manager acted on
// this" for either outcome, distinguished by salesStatus + salesRejectionReason.
export async function processRejectedSale({
  salesId,
  rejectedBy,
  reason,
}: {
  salesId: number;
  rejectedBy: number;
  reason?: string | null;
}) {
  const pool = await getDBConnection();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [sales] = await getSalesServices.findSalesBySaleId({
      connection,
      salesId,
    });

    if (!sales) {
      throw new Error("Sale not found");
    }
    if (sales.salesStatus !== SalesStatus.PENDING_APPROVAL) {
      throw new Error("Only a pending-approval sale can be rejected");
    }

    const rejectedAt = new Date().toISOString().slice(0, 19).replace("T", " ");
    await updateSalesByFields({
      connection,
      updates: [
        {
          salesId,
          salesStatus: SalesStatus.REJECTED,
          salesApprovedBy: rejectedBy,
          salesApprovedAt: rejectedAt,
          salesRejectionReason: reason ?? null,
        },
      ],
      keyFields: ["salesId"],
    });

    await connection.commit();

    return await getSalesServices.findSalesBySaleId({
      salesId,
      includeSaleItems: true,
    });
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}
