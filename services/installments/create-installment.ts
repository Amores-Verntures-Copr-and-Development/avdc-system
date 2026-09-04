import { CreateInstallmentDto } from "@/dtos/installment.dto";
import { getDBConnection } from "@/lib/db";
import { BusinessError } from "@/lib/errors";
import {
  insertInstallment,
  insertInstallmentChecks,
} from "@/models/installmentModel";
import { generateInstallmentNo } from "./generate-installment-no";
import { findInstallmentById } from "./get-installments";

export async function processCreateInstallment(data: CreateInstallmentDto) {
  if (!data.checks || data.checks.length === 0) {
    throw new BusinessError(
      "An installment plan needs at least one scheduled check.",
    );
  }

  if (data.checks.length !== data.installmentTotalMonthsPlan) {
    throw new BusinessError(
      `Expected ${data.installmentTotalMonthsPlan} scheduled check(s), got ${data.checks.length}.`,
    );
  }

  const pool = await getDBConnection();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const installmentNo = await generateInstallmentNo({
      connection,
      storeId: data.storeId,
    });

    const installmentId = await insertInstallment({
      connection,
      data,
      installmentNo,
    });

    await insertInstallmentChecks({
      connection,
      installmentId,
      checks: data.checks,
    });

    const installment = await findInstallmentById({
      connection,
      installmentId,
    });

    await connection.commit();

    return installment;
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}
