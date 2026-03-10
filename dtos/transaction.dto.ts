import { Transactions } from "@/types/transaction";

export type CreateTransactionDto = Pick<
  Transactions,
  | "referenceId"
  | "storeId"
  | "transactionAmount"
  | "transactionCreatedBy"
  | "transactionRef"
  | "transactionType"
  | "referenceId"
>;
