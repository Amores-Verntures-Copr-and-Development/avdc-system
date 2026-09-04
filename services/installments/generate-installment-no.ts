import { selectCountInstallments } from "@/models/installmentModel";
import { PoolConnection } from "mysql2/promise";

export async function generateInstallmentNo({
  connection,
  storeId,
}: {
  connection: PoolConnection;
  storeId: number;
}) {
  const totalInstallments = await selectCountInstallments({
    connection,
    storeId,
  });

  return `INST-${(totalInstallments + 1).toString().padStart(6, "0")}`;
}
