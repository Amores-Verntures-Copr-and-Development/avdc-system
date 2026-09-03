import { getSalesTrendByProductVariant } from "@/controllers/SaleController";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { assertStoreAccess } from "@/lib/auth/assertStoreAccess";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ prodVarId: string }> },
) {
  try {
    const prodVarId = Number((await params).prodVarId);
    const { searchParams } = new URL(_request.url);
    const storeIdParam = searchParams.get("storeId") || "";
    const store = searchParams.get("store") || "";
    const fromParam = searchParams.get("from") || "";
    const toParam = searchParams.get("to") || "";
    const trendParam = searchParams.get("trend") || "";

    const from = fromParam ? `${fromParam} 00:00:00` : "";
    const to = toParam ? `${toParam} 23:59:59` : "";
    const trend =
      trendParam === "month" || trendParam === "weeks" || trendParam === "days"
        ? trendParam
        : "days";

    const storeId = storeIdParam ? Number(storeIdParam) : undefined;
    if (storeId) {
      const actingUser = getCurrentUser(_request);
      await assertStoreAccess(actingUser, storeId);
    }

    const res = await getSalesTrendByProductVariant({
      prodVarId,
      trend,
      storeId,
      storeName: store,
      from,
      to,
    });

    if (!res.success) {
      throw new Error(`${res.error}`);
    }

    return NextResponse.json(
      {
        success: true,
        message: res.message,
        data: res.data,
      },
      { status: 200 },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err?.message,
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
