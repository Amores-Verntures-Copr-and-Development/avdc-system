import {
  getInstallmentCollectionTrend,
  getInstallments,
  getInstallmentsForStores,
  getInstallmentsSummaryForStores,
  getInstallmentStatusBreakdown,
  getTopOutstandingCustomers,
  getUpcomingChecks,
} from "@/controllers/InstallmentController";
import { findInstallmentById } from "@/services/installments/get-installments";
import { verifyExternalDashboardSession } from "@/services/externalDashboardAccess/dashboard-session-jwt";
import { resolveExternalDashboardScope } from "@/services/externalDashboardAccess/resolve-scope";
import { DisplayInstallmentDetail } from "@/types/installments";
import { NextRequest, NextResponse } from "next/server";

// Companion to /api/external-dashboard/sales - same auth pattern (Bearer
// session token, re-checked live against the grant), same dual-mode shape
// (?installmentId= for a single plan's detail with its checks, ?storeId=
// for the list), but additionally gated on isInstallmentPermitted() since a
// grant can restrict a store to sales-only.
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const sessionToken = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : "";

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let userId: number;
    try {
      ({ userId } = verifyExternalDashboardSession(sessionToken));
    } catch {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 },
      );
    }

    const { access, storeIds, isPermittedStore, isInstallmentPermitted } =
      await resolveExternalDashboardScope(userId);
    if (!access) {
      return NextResponse.json(
        { error: "External dashboard access has been revoked" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(req.url);
    const installmentIdParam = searchParams.get("installmentId");

    // The dashboard-wide tile has no single store to scope to - it wants the
    // combined totals across whatever store(s) this grant permits for
    // installments (a "sales only" store is excluded, same as the list/
    // detail modes below). An explicit storeId still narrows it to one.
    if (searchParams.get("summary")) {
      const storeIdParam = searchParams.get("storeId");
      let summaryStoreIds = storeIds.filter((id) => isInstallmentPermitted(id));

      if (storeIdParam) {
        const requestedStoreId = Number(storeIdParam);

        if (
          !isPermittedStore(requestedStoreId) ||
          !isInstallmentPermitted(requestedStoreId)
        ) {
          return NextResponse.json(
            { error: "Store is outside your granted installment access" },
            { status: 403 },
          );
        }

        summaryStoreIds = [requestedStoreId];
      }

      const res = await getInstallmentsSummaryForStores({
        storeIds: summaryStoreIds,
      });

      if (!res.success) {
        throw new Error("Failed to fetch installment summary!");
      }

      return NextResponse.json(
        { success: true, data: res.data },
        { status: 200 },
      );
    }

    // Both dashboard-wide widgets below share the same permitted-stores
    // scope as the summary tile - no single storeId to narrow to.
    if (searchParams.get("trend")) {
      const monthsParam = Number(searchParams.get("months"));
      const trendStoreIds = storeIds.filter((id) => isInstallmentPermitted(id));

      const res = await getInstallmentCollectionTrend({
        storeIds: trendStoreIds,
        months: monthsParam || undefined,
      });

      if (!res.success) {
        throw new Error("Failed to fetch installment collection trend!");
      }

      return NextResponse.json(
        { success: true, data: res.data },
        { status: 200 },
      );
    }

    if (searchParams.get("statusBreakdown")) {
      const statusStoreIds = storeIds.filter((id) =>
        isInstallmentPermitted(id),
      );

      const res = await getInstallmentStatusBreakdown({
        storeIds: statusStoreIds,
      });

      if (!res.success) {
        throw new Error("Failed to fetch installment status breakdown!");
      }

      return NextResponse.json(
        { success: true, data: res.data },
        { status: 200 },
      );
    }

    if (searchParams.get("topCustomers")) {
      const topCustomersLimit = Number(searchParams.get("limit")) || 5;
      const topCustomersStoreIds = storeIds.filter((id) =>
        isInstallmentPermitted(id),
      );

      const res = await getTopOutstandingCustomers({
        storeIds: topCustomersStoreIds,
        limit: topCustomersLimit,
      });

      if (!res.success) {
        throw new Error("Failed to fetch top outstanding customers!");
      }

      return NextResponse.json(
        { success: true, data: res.data },
        { status: 200 },
      );
    }

    if (searchParams.get("upcoming")) {
      const upcomingLimit = Number(searchParams.get("limit")) || 5;
      const upcomingPage = Number(searchParams.get("page")) || 1;
      const upcomingOffset = upcomingLimit * (upcomingPage - 1);
      const upcomingStoreIds = storeIds.filter((id) =>
        isInstallmentPermitted(id),
      );

      const res = await getUpcomingChecks({
        storeIds: upcomingStoreIds,
        limit: upcomingLimit,
        offset: upcomingOffset,
      });

      if (!res.success) {
        throw new Error("Failed to fetch upcoming checks!");
      }

      return NextResponse.json(
        { success: true, data: res.data, count: res.count },
        { status: 200 },
      );
    }

    if (installmentIdParam) {
      const installmentId = Number(installmentIdParam);

      if (!installmentId) {
        return NextResponse.json(
          { error: "No installment id found" },
          { status: 400 },
        );
      }

      const installment = (await findInstallmentById({
        installmentId,
      })) as DisplayInstallmentDetail | null;

      if (!installment) {
        return NextResponse.json(
          { error: "Installment plan not found" },
          { status: 404 },
        );
      }

      if (
        !isPermittedStore(installment.storeId) ||
        !isInstallmentPermitted(installment.storeId)
      ) {
        return NextResponse.json(
          { error: "Installment plan is outside your granted access" },
          { status: 403 },
        );
      }

      return NextResponse.json(
        { success: true, data: installment },
        { status: 200 },
      );
    }

    const storeIdParam = searchParams.get("storeId");
    const search = searchParams.get("search") || "";
    const limitParam = searchParams.get("limit") || "";
    const pageParam = searchParams.get("page") || "";
    const limit = Number(limitParam) || 20;
    const page = Number(pageParam) || 1;
    const offset = limit * (page - 1);

    if (storeIdParam) {
      const storeId = Number(storeIdParam);

      if (!isPermittedStore(storeId) || !isInstallmentPermitted(storeId)) {
        return NextResponse.json(
          { error: "Store is outside your granted installment access" },
          { status: 403 },
        );
      }

      const res = await getInstallments({ storeId, search, limit, offset });

      if (!res.success) {
        throw new Error("Failed to fetch installments!");
      }

      return NextResponse.json(
        { success: true, data: res.data, count: res.count },
        { status: 200 },
      );
    }

    // No storeId - list plans across every store this grant permits for
    // installments, same company-wide scope as the summary/trend/upcoming
    // widgets above.
    const listStoreIds = storeIds.filter((id) => isInstallmentPermitted(id));

    const res = await getInstallmentsForStores({
      storeIds: listStoreIds,
      search,
      limit,
      offset,
    });

    if (!res.success) {
      throw new Error("Failed to fetch installments!");
    }

    return NextResponse.json(
      { success: true, data: res.data, count: res.count },
      { status: 200 },
    );
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to fetch installments!" },
      { status: 400 },
    );
  }
}
