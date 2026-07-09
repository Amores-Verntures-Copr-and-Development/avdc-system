import { LoyverseIntegrationController } from "@/controllers/IntegrationController";
import { LoyverseItem } from "@/types/loyverse-integration";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ integId: string }>;
  },
) {
  try {
    const { integId } = await params;
    if (!integId) {
      throw new Error("No integration ID found!");
    }

    const integRes = await LoyverseIntegrationController.get({
      keyFields: { integId: Number(integId) },
    });

    if (integRes.data?.length === 0) {
      throw new Error("No data found!");
    }

    const loyverse = integRes.data?.filter(
      (i) => i.integId === Number(integId),
    );

    if (!loyverse) {
      throw new Error("No loyverse integration found!");
    }

    const res = await fetch("https://api.loyverse.com/v1.0/items", {
      headers: {
        Authorization: `Bearer ${loyverse[0].accessToken}`,
      },
    });

    const items = await res.json();

    const filteredItems = items.items.filter((item: LoyverseItem) =>
      item.variants.some((variant: any) =>
        variant.stores.some(
          (store: any) => store.store_id === loyverse[0].storeId,
        ),
      ),
    );

    return NextResponse.json(
      {
        success: true,
        message: "Items fetch successfully!",
        data: filteredItems,
      },
      { status: 200 },
    );
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        message: e.message,
      },
      { status: 400 },
    );
  }
}
