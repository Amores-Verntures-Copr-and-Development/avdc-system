import { CreateVoucherDto } from "@/dtos/voucher.dto";
import { getDBConnection } from "@/lib/db";
import {
  insertVoucher,
  insertVoucherStores,
  selectVoucherById,
} from "@/models/voucherModel";

export async function createVoucher(data: CreateVoucherDto) {
  const pool = await getDBConnection();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const result = await insertVoucher({ connection, data });

    if (
      !data.voucherIsAllStores &&
      data.storeIds &&
      data.storeIds.length > 0
    ) {
      await insertVoucherStores({
        connection,
        voucherId: result.insertId,
        storeIds: data.storeIds,
      });
    }

    const voucher = await selectVoucherById({
      connection,
      voucherId: result.insertId,
    });

    await connection.commit();

    return voucher;
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}
