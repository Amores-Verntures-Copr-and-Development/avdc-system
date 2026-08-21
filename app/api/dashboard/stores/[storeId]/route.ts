import { StoreDashboardController } from "@/controllers/DashboardController";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { assertStoreAccess } from "@/lib/auth/assertStoreAccess";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ storeId: string }>;
  },
) {
  try {
    const slug = (await params).storeId;

    const storeId = Number(slug);
    if (!storeId) {
      throw new Error("No store ID found!");
    }

    const actingUser = getCurrentUser(_request);
    await assertStoreAccess(actingUser, storeId);

    const res = await StoreDashboardController(storeId);

    if (!res.success) {
      throw new Error(res.message);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Store Dashboard fetched successfully!",
        data: res.data,
      },
      { status: 201 },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err?.message || String(err),
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
