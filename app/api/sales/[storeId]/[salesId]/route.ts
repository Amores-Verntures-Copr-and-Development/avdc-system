import { updateSalesController } from "@/controllers/SaleController";
import { getSalesServices } from "@/services/sales/get-sales";
import { Sales } from "@/types/sales";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { assertStoreAccess } from "@/lib/auth/assertStoreAccess";
import { NextRequest, NextResponse } from "next/server";

function errorStatus(err: any): number {
  if (err?.message === "Unauthorized") return 401;
  if (err?.message === "You do not have access to this store") return 403;
  return 500;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string; salesId: string }> },
) {
  try {
    const slug2 = (await params).salesId;
    const salesId = Number(slug2);

    if (!salesId) {
      throw new Error("No sales id found");
    }

    const actingUser = getCurrentUser(request);

    // The update targets data.salesId (see updateSalesController below),
    // not the URL's salesId/storeId - those are just for routing. Look up
    // the sale's real store so a caller can't bypass the store check by
    // putting a store they DO have access to in the URL while the body
    // actually targets a sale in a different store.
    const existing = await getSalesServices.findSalesBySaleId({ salesId });
    const existingSale = Array.isArray(existing) ? existing[0] : undefined;

    if (!existingSale) {
      throw new Error("Sale not found");
    }

    await assertStoreAccess(actingUser, Number(existingSale.storeId));

    const data = (await request.json()) as Partial<Sales>;
    data.salesId = salesId;
    // updateSalesBySalesId requires storeId as part of its WHERE match -
    // use the sale's real store (already verified above), never a
    // client-supplied one.
    data.storeId = Number(existingSale.storeId);

    const res = await updateSalesController({ data: data });
    if (!res.success) {
      throw new Error(res.message || "Failed to update sales");
    }
    return NextResponse.json(
      {
        success: true,
        message: res.message,
        data: res.data,
      },
      { status: 201 },
    );
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        message: e?.message,
        error: e?.message || String(e),
      },
      { status: errorStatus(e) },
    );
  }
}
