import { getKioskProductVariantController } from "@/controllers/ProductController";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { assertStoreAccess } from "@/lib/auth/assertStoreAccess";
import { NextRequest, NextResponse } from "next/server";

function errorStatus(err: any): number {
  if (err?.message === "Unauthorized") return 401;
  if (err?.message === "You do not have access to this store") return 403;
  return 500;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> },
) {
  try {
    const slug = (await params).storeId;
    const storeId = Number(slug);

    if (!storeId) {
      throw new Error("No store found");
    }

    const actingUser = getCurrentUser(request);
    await assertStoreAccess(actingUser, storeId);

    const res = await getKioskProductVariantController({ storeId });

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
        message: "Failed to fetch kiosk menu!",
        error: err?.message || String(err),
      },
      { status: errorStatus(err) },
    );
  }
}
