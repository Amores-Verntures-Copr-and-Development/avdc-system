import { getSales, getSalesByStoreId } from "@/controllers/SaleController";
import { verifyExternalDashboardSession } from "@/services/externalDashboardAccess/dashboard-session-jwt";
import { resolveExternalDashboardScope } from "@/services/externalDashboardAccess/resolve-scope";
import { NextRequest, NextResponse } from "next/server";

// Companion to /api/overview - same auth pattern (Bearer session token,
// re-checked live against the grant). Handles both the sales list
// (?storeId=) and a single sale's detail with line items (?salesId=) in one
// route so this stays a single static entry in middleware.ts's
// publicApiRoutes allowlist, which matches pathnames exactly.
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

    const { access, isPermittedStore } =
      await resolveExternalDashboardScope(userId);
    if (!access) {
      return NextResponse.json(
        { error: "External dashboard access has been revoked" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(req.url);
    const salesIdParam = searchParams.get("salesId");

    if (salesIdParam) {
      const salesId = Number(salesIdParam);

      if (!salesId) {
        return NextResponse.json(
          { error: "No sales id found" },
          { status: 400 },
        );
      }

      const res = await getSales({
        keyFields: { salesId },
        includeSaleItems: true,
      });

      if (!res.success) {
        throw new Error("Failed to fetch sale!");
      }

      const sale = res.data?.[0];

      if (!sale) {
        return NextResponse.json({ error: "Sale not found" }, { status: 404 });
      }

      if (!isPermittedStore(sale.storeId)) {
        return NextResponse.json(
          { error: "Sale is outside your granted access" },
          { status: 403 },
        );
      }

      return NextResponse.json({ success: true, data: sale }, { status: 200 });
    }

    const storeId = Number(searchParams.get("storeId"));

    if (!storeId) {
      return NextResponse.json(
        { error: "No store id found" },
        { status: 400 },
      );
    }

    if (!isPermittedStore(storeId)) {
      return NextResponse.json(
        { error: "Store is outside your granted access" },
        { status: 403 },
      );
    }

    const search = searchParams.get("search") || "";
    const limitParam = searchParams.get("limit") || "";
    const pageParam = searchParams.get("page") || "";
    const fromParam = searchParams.get("from") || "";
    const toParam = searchParams.get("to") || "";

    const from = fromParam ? `${fromParam} 00:00:00` : "";
    const to = toParam ? `${toParam} 23:59:59` : "";
    const limit = Number(limitParam) || 20;
    const page = Number(pageParam) || 1;
    const offset = limit * (page - 1);

    const res = await getSalesByStoreId({
      storeId,
      search,
      from,
      to,
      offset,
      limit,
      // Same exclusions as /api/external-dashboard/sales - refunded sales
      // clutter this read-only view, and pending-approval/rejected sales
      // aren't real sales at all.
      excludeStatus: ["refunded", "pending_approval", "rejected"],
    });

    if (!res.success) {
      throw new Error("Failed to fetch sales!");
    }

    return NextResponse.json(
      { success: true, data: res.data, count: res.count },
      { status: 200 },
    );
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to fetch sales!" },
      { status: 400 },
    );
  }
}
