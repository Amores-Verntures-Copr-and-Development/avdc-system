import { OverviewController } from "@/controllers/OverviewController";
import { verifyExternalDashboardSession } from "@/services/externalDashboardAccess/dashboard-session-jwt";
import { resolveExternalDashboardScope } from "@/services/externalDashboardAccess/resolve-scope";
import { NextRequest, NextResponse } from "next/server";

// Only consumer of this route is avdc-track - scoped to whichever stores
// the logged-in dashboard user was granted, re-checked live on every
// request (not cached in the session JWT) so a revoke or a scope change
// from Users > External Dashboard Access takes effect immediately.
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

    const { access, storeIds: grantedStoreIds, isPermittedStore } =
      await resolveExternalDashboardScope(userId);
    if (!access) {
      return NextResponse.json(
        { error: "External dashboard access has been revoked" },
        { status: 403 },
      );
    }

    let storeIds: number[] | undefined = grantedStoreIds;

    const { searchParams } = new URL(req.url);
    const storeIdParam = searchParams.get("storeId");

    if (storeIdParam) {
      const requestedStoreId = Number(storeIdParam);

      if (!isPermittedStore(requestedStoreId)) {
        return NextResponse.json(
          { error: "Store is outside your granted access" },
          { status: 403 },
        );
      }

      storeIds = [requestedStoreId];
    }

    const trendParam = searchParams.get("trend") || "";
    const fromParam = searchParams.get("from") || "";
    const toParam = searchParams.get("to") || "";

    const from = fromParam ? `${fromParam} 00:00:00` : "";
    const to = toParam ? `${toParam} 23:59:59` : "";

    const trend =
      trendParam === "year" ||
      trendParam === "month" ||
      trendParam === "weeks" ||
      trendParam === "days"
        ? trendParam
        : undefined;

    const res = await OverviewController.get({
      trend: trend,
      from,
      to,
      notZeroSales: true,
      storeIds,
    });

    if (!res.success) {
      throw new Error("Failed to fetch!");
    }
    return NextResponse.json(
      {
        data: res.data,
      },
      { status: 200 },
    );
  } catch (e) {
    return NextResponse.json(
      {
        error: "Failed to fetch!",
      },
      { status: 400 },
    );
  }
}
