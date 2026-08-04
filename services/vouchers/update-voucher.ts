import { UpdateVoucherDto } from "@/dtos/voucher.dto";
import { getDBConnection } from "@/lib/db";
import {
  deleteVoucherStoresByVoucherId,
  insertVoucherStores,
  selectVoucherById,
  updateVoucher as updateVoucherModel,
  updateVoucherBalance,
} from "@/models/voucherModel";

export async function updateVoucher(voucherId: number, data: UpdateVoucherDto) {
  const pool = await getDBConnection();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const existing = await selectVoucherById({ connection, voucherId });
    if (!existing) {
      throw new Error("Voucher not found");
    }

    await updateVoucherModel({ connection, voucherId, data });

    // Editing a fixed voucher's value preserves whatever has already been
    // spent - shift the balance by the same delta rather than resetting it,
    // so a partially-redeemed voucher doesn't regain spent value for free.
    if (
      existing.voucherValueType === "fixed" &&
      data.voucherFixedValue !== undefined &&
      data.voucherFixedValue !== null
    ) {
      const alreadySpent =
        Number(existing.voucherFixedValue ?? 0) -
        Number(existing.voucherBalance ?? 0);
      const newBalance = Math.max(
        Number(data.voucherFixedValue) - alreadySpent,
        0,
      );

      await updateVoucherBalance({ connection, voucherId, voucherBalance: newBalance });
    }

    if (data.voucherIsAllStores !== undefined) {
      await deleteVoucherStoresByVoucherId({ connection, voucherId });

      if (!data.voucherIsAllStores && data.storeIds && data.storeIds.length > 0) {
        await insertVoucherStores({
          connection,
          voucherId,
          storeIds: data.storeIds,
        });
      }
    }

    const voucher = await selectVoucherById({ connection, voucherId });

    await connection.commit();

    return voucher;
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}
