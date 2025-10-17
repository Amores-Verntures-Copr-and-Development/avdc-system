export type EmployeePosition =
  | "purchaser"
  | "supervisor"
  | "accounting"
  | "hr"
  | "staff"
  | null;

export interface EmployeeInterface {
  empId: number;
  empPosition: EmployeePosition;
  empCreatedAt: string;
  empUpdatedAt: string;
  empDeletedAt?: string | null;
  userId: number;
  storeId?: number | null;
}
