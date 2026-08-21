import { getOwnerRecentStoreSales } from "@/controllers/DashboardController";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { resolveStoreScope } from "@/lib/auth/resolveStoreScope";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const actingUser = getCurrentUser(req);
    const scope = await resolveStoreScope(actingUser);
    const res = await getOwnerRecentStoreSales({
      storeIds: scope.storeId ? [scope.storeId] : scope.storeIds,
    });

    if (!res.success) {
      throw new Error(`${res.error}`);
    }

    return NextResponse.json(
      {
        success: true,
        message: res.message,
        data: res.data, // could sanitize before returning
      },
      { status: 201 },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetched inventory!",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
