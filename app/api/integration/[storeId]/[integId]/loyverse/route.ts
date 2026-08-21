import { LoyverseIntegrationController } from "@/controllers/IntegrationController";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { assertStoreAccess } from "@/lib/auth/assertStoreAccess";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string; integId: string }> },
) {
  try {
    const { storeId, integId } = await params;
    if (!integId) {
      throw new Error("No store ID found!");
    }

    const actingUser = getCurrentUser(req);
    await assertStoreAccess(actingUser, Number(storeId));

    const res = await LoyverseIntegrationController.get({
      keyFields: { integId: Number(integId) },
    });
    if (!res.success) {
      throw new Error("Failed to fetch!");
    }
    return NextResponse.json(
      {
        success: true,
        message: "Fetched successly!",
        data: res.data,
        count: res.count,
      },
      { status: 200 },
    );
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        message: "Fetched failed!",
      },
      { status: 400 },
    );
  }
}
