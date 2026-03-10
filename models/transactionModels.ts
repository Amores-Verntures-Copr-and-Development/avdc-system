import { CreateTransactionDto } from "@/dtos/transaction.dto";
import { getDBConnection } from "@/lib/db";
import { PoolConnection, ResultSetHeader } from "mysql2/promise";

export const insertTransactions = async ({
  connection,
  data,
}: {
  connection?: PoolConnection;
  data: CreateTransactionDto;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const sql = `INSERT INTO Transactions(transactionRef,referenceId,transactionAmount,transactionType,transactionCreatedBy,storeId) VALUES(?,?,?,?,?,?)`;
  const [results] = await pool.execute<ResultSetHeader>(sql, [
    data.transactionRef,
    data.referenceId,
    data.transactionAmount,
    data.transactionType,
    data.transactionCreatedBy,
    data.storeId,
  ]);
  return results.insertId;
};
