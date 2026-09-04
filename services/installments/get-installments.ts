import {
  selectCountInstallmentsForStores,
  selectCountUpcomingChecksForStores,
  selectInstallmentById,
  selectInstallmentChecksByInstallmentId,
  selectInstallmentCollectionTrendForStores,
  selectInstallments,
  selectInstallmentsForStores,
  selectInstallmentStatusBreakdownForStores,
  selectInstallmentSummary,
  selectInstallmentSummaryForStores,
  selectTopOutstandingCustomersForStores,
  selectUpcomingChecksForStores,
} from "@/models/installmentModel";
import { PoolConnection } from "mysql2/promise";

export async function listInstallments({
  storeId,
  search,
  limit,
  offset,
}: {
  storeId: number;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  return selectInstallments({ storeId, search, limit, offset });
}

export async function findInstallmentById({
  connection,
  installmentId,
  storeId,
}: {
  connection?: PoolConnection;
  installmentId: number;
  storeId?: number;
}) {
  const pool = connection;
  const installment = await selectInstallmentById({
    connection: pool,
    installmentId,
    storeId,
  });

  if (!installment) return null;

  const checks = await selectInstallmentChecksByInstallmentId({
    connection: pool,
    installmentId,
  });

  return { ...(installment as object), checks };
}

export async function getInstallmentSummary({ storeId }: { storeId: number }) {
  return selectInstallmentSummary({ storeId });
}

export async function listInstallmentsForStores({
  storeIds,
  search,
  limit,
  offset,
}: {
  storeIds: number[];
  search?: string;
  limit?: number;
  offset?: number;
}) {
  return selectInstallmentsForStores({ storeIds, search, limit, offset });
}

export async function getInstallmentsCountForStores({
  storeIds,
  search,
}: {
  storeIds: number[];
  search?: string;
}) {
  return selectCountInstallmentsForStores({ storeIds, search });
}

export async function getInstallmentSummaryForStores({
  storeIds,
}: {
  storeIds: number[];
}) {
  return selectInstallmentSummaryForStores({ storeIds });
}

export async function getInstallmentCollectionTrendForStores({
  storeIds,
  months,
}: {
  storeIds: number[];
  months?: number;
}) {
  return selectInstallmentCollectionTrendForStores({ storeIds, months });
}

export async function getUpcomingChecksForStores({
  storeIds,
  limit,
  offset,
}: {
  storeIds: number[];
  limit?: number;
  offset?: number;
}) {
  return selectUpcomingChecksForStores({ storeIds, limit, offset });
}

export async function getUpcomingChecksCountForStores({
  storeIds,
}: {
  storeIds: number[];
}) {
  return selectCountUpcomingChecksForStores({ storeIds });
}

export async function getInstallmentStatusBreakdownForStores({
  storeIds,
}: {
  storeIds: number[];
}) {
  return selectInstallmentStatusBreakdownForStores({ storeIds });
}

export async function getTopOutstandingCustomersForStores({
  storeIds,
  limit,
}: {
  storeIds: number[];
  limit?: number;
}) {
  return selectTopOutstandingCustomersForStores({ storeIds, limit });
}
