import { Installment, InstallmentCheck } from "@/types/installments";

export type CreateInstallmentCheckDto = Pick<
  InstallmentCheck,
  | "installmentCheckSequenceNo"
  | "installmentCheckNo"
  | "installmentCheckDate"
  | "installmentCheckGrossAmount"
  | "installmentCheckEwtWithheld"
  | "installmentCheckNetAmount"
  | "installmentCheckNotes"
>;

export type CreateInstallmentDto = Pick<
  Installment,
  | "installmentClientCode"
  | "installmentDescription"
  | "installmentTotalMonthsPlan"
  | "installmentTotalAmount"
  | "installmentStartDate"
  | "installmentEwtRate"
  | "installmentNotes"
  | "customerId"
  | "storeId"
> & {
  installmentCreatedBy: number; // set server-side from the session
  checks: CreateInstallmentCheckDto[];
};

export type UpdateInstallmentCheckDto = Partial<
  Pick<
    InstallmentCheck,
    | "installmentCheckStatus"
    | "installmentCheckDepositedDate"
    | "installmentCheckNo"
    | "installmentCheckNotes"
  >
> & {
  installmentCheckDepositedBy?: number | null;
};
