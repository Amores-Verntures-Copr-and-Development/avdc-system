import { CreateTransactionDto } from "@/dtos/transaction.dto";
import { insertTransactions } from "@/models/transactionModels";
import { PoolConnection } from "mysql2/promise";

export async function createTransactions({
  connection,
  data,
}: {
  connection?: PoolConnection;
  data: CreateTransactionDto;
}) {
  try {
    const result = await insertTransactions({ data, connection });
    return result;
  } catch (e) {
    throw e;
  }
}
