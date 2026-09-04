export type InstallmentStatus =
  "active" | "completed" | "cancelled" | "defaulted";

export type InstallmentCheckStatus =
  "pending" | "deposited" | "bounced" | "cancelled";

export interface Installment {
  installmentId: number;
  installmentNo: string;
  installmentClientCode: string;
  installmentDescription: string;
  installmentTotalMonthsPlan: number;
  installmentTotalAmount: number;
  installmentStartDate: string;
  installmentEwtRate: number | null;
  installmentStatus: InstallmentStatus;
  installmentNotes: string | null;
  installmentCreatedAt?: string;
  installmentUpdatedAt?: string;
  installmentDeletedAt?: string | null;
  installmentCreatedBy: number;
  customerId: number;
  storeId: number;
}

export interface InstallmentCheck {
  installmentCheckId: number;
  installmentCheckSequenceNo: number;
  installmentCheckNo: string | null;
  installmentCheckDate: string;
  installmentCheckDepositedDate: string | null;
  installmentCheckGrossAmount: number;
  installmentCheckEwtWithheld: number;
  installmentCheckNetAmount: number;
  installmentCheckStatus: InstallmentCheckStatus;
  installmentCheckNotes: string | null;
  installmentCheckDepositedBy: number | null;
  installmentCheckDepositedByName?: string | null;
  installmentCheckCreatedAt?: string;
  installmentCheckUpdatedAt?: string;
  installmentId: number;
}

export interface DisplayInstallment extends Installment {
  customerName?: string;
  installmentCreatedByName?: string;
  totalChecks?: number;
  depositedChecks?: number;
  depositedAmount?: number;
  pendingAmount?: number;
  lastDepositedDate?: string | null;
  nextDueDate?: string | null;
}

export interface DisplayInstallmentDetail extends DisplayInstallment {
  checks: InstallmentCheck[];
}

export interface InstallmentSummary {
  totalPlans: number;
  activePlans: number;
  totalPortfolio: number;
  totalCollected: number;
  totalOutstanding: number;
  checksDueToday: number;
}

// Adds the two extra buckets the external dashboard's tile needs
// (overdue vs. due-this-week, distinct from checksDueToday) - kept separate
// from InstallmentSummary rather than added to it, so the single-store
// summary used by the internal admin app is untouched.
export interface InstallmentSummaryExtended extends InstallmentSummary {
  overdueChecks: number;
  checksDueThisWeek: number;
}

export interface InstallmentCollectionTrendPoint {
  period: string;
  collectedAmount: number;
}

export interface UpcomingCheck {
  installmentCheckId: number;
  installmentCheckNo: string | null;
  installmentCheckDate: string;
  installmentCheckGrossAmount: number;
  installmentCheckStatus: InstallmentCheckStatus;
  installmentCheckSequenceNo: number;
  installmentTotalMonthsPlan: number;
  customerName: string;
  installmentId: number;
  installmentNo: string;
  storeId: number;
}

export interface InstallmentStatusBreakdown {
  status: InstallmentStatus;
  count: number;
  totalAmount: number;
}

export interface TopOutstandingCustomer {
  installmentId: number;
  installmentNo: string;
  storeId: number;
  customerName: string;
  pendingAmount: number;
  depositedChecks: number;
  installmentTotalMonthsPlan: number;
}
