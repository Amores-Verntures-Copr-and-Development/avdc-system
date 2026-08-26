import { getOrderController } from "@/controllers/OrderController";
import { OrderStatus, Orders } from "@/types/orders";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { NextRequest, NextResponse } from "next/server";

function errorStatus(err: any): number {
  if (err?.message === "Unauthorized") return 401;
  if (err?.message === "You do not have access to this store") return 403;
  return 500;
}

// "All Stores" view of Orders - lists orders across every store in the
// acting user's company, unlike GET /api/order/[storeId] which is scoped
// to one store. Supervisor/staff stay locked to their single session store
// (see app/orders/OrderPage.tsx), so this is rejected for them even if
// called directly.
export async function GET(request: NextRequest) {
  try {
    const actingUser = getCurrentUser(request);
    const empPosition = (actingUser as unknown as { empPosition?: string })
      .empPosition;

    if (empPosition === "supervisor" || empPosition === "staff") {
      throw new Error("You do not have access to this store");
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const limit = searchParams.get("limit") || "";
    const page = searchParams.get("page") || "";
    const status = searchParams.get("status") as OrderStatus | null;
    const storeIdParam = searchParams.get("storeId");
    const limitNumber = Number(limit) || 100;
    const pageNumber = Number(page) || 1;

    const keyFields: Partial<Orders> = {};
    if (storeIdParam) {
      keyFields.storeId = Number(storeIdParam);
    }
    if (status) {
      keyFields.orderStatus = status;
    }

    const res = await getOrderController({
      keyFields,
      search,
      limit: limitNumber,
      offset: limitNumber * (pageNumber - 1),
      companyId:
        actingUser.userRole === "superadmin"
          ? undefined
          : (actingUser.companyId ?? undefined),
    });

    if (!res.success) {
      throw new Error(`${res.error}`);
    }

    return NextResponse.json(
      {
        success: true,
        message: res.message,
        data: res.data,
        count: res.count,
      },
      { status: 200 },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err?.message || "Failed to fetch orders!",
        error: err?.message || String(err),
      },
      { status: errorStatus(err) },
    );
  }
}
