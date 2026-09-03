import { createSale } from "@/controllers/SaleController";
import { CreateSaleDto } from "@/dtos/sales.dto";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { assertStoreAccess } from "@/lib/auth/assertStoreAccess";
import { selectStoreSalesApprovalEnabled } from "@/models/storeModels";
import { SalesStatus } from "@/types/sales";
import { BusinessError } from "@/lib/errors";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> },
) {
  try {
    const slug = (await params).storeId;
    if (!slug) {
      throw new Error("No storeId found!");
    }

    const storeId = Number(slug);
    const actingUser = getCurrentUser(_request);
    await assertStoreAccess(actingUser, storeId);

    const data = (await _request.json()) as CreateSaleDto;
    if (!data) {
      throw new Error("No data found!");
    }

    // Staff/supervisor POS sales at a store with approval enabled land as
    // pending_approval instead of completed - a manager must approve them
    // before they count as a real sale. Owners/admins/accounting bypass
    // this since they're the ones who'd be approving anyway.
    const empPosition = (actingUser as unknown as { empPosition?: string })
      .empPosition;
    if (empPosition === "staff" || empPosition === "supervisor") {
      const requiresApproval = await selectStoreSalesApprovalEnabled(storeId);
      if (requiresApproval) {
        data.salesStatus = SalesStatus.PENDING_APPROVAL;
      }
    }

    const res = await createSale(data);
    if (!res.success) {
      // Re-throw the original error when it's a BusinessError (e.g. "out of
      // stock") so its type - and therefore its safe-to-display message -
      // survives into the catch below; anything else becomes a plain Error,
      // which the catch treats as unsafe to show verbatim.
      throw res.error instanceof BusinessError
        ? res.error
        : new Error(res.message || "Failed to process order");
    }

    return NextResponse.json({
      success: true,
      message: res.message,
      data: res.data,
    });
  } catch (err: any) {
    console.log({ error: err });
    // Only a BusinessError's message is safe to show a cashier verbatim -
    // anything else (a raw DB/driver error, a bug) could leak internal
    // detail (table/column names, connection errors) onto the POS screen.
    const isBusinessError = err instanceof BusinessError;
    return NextResponse.json(
      {
        success: false,
        message: isBusinessError
          ? err.message
          : "Failed to create sale. Please try again.",
        error: err?.message || String(err),
      },
      { status: isBusinessError ? 409 : 500 },
    );
  }
}
