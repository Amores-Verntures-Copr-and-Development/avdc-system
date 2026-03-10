export type TranscationRef = "sale" | "refund";
export type transactionType = "in" | "out";

export interface Transactions {
  transactionId: number;
  transactionRef: TranscationRef;
  referenceId: number;
  transactionAmount: number;
  transactionType: "in" | "out";
  transactionCreatedAt: string;
  transactionCreatedBy: number;
  storeId: number;
}
