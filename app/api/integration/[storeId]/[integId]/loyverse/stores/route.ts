import { LoyverseIntegrationController } from "@/controllers/IntegrationController";
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

    const res = await LoyverseIntegrationController.get({
      keyFields: { integId: Number(integId) },
    });

    if (!res.success) {
      throw new Error("Failed to fetch integration!");
    }

    const integration = res.data?.find((i) => i.integId === Number(integId));

    if (!integration) {
      throw new Error("No Loyverse integration found!");
    }

    const storeRes = await fetch("https://api.loyverse.com/v1.0/stores", {
      headers: {
        Authorization: `Bearer ${integration.accessToken}`,
        Accept: "application/json",
      },
    });

    const storeData = await storeRes.json();
    if (!storeRes.ok) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to fetch Loyverse merchant",
          error: storeData,
        },
        { status: storeRes.status },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Fetched successfully!",
        data: storeData.stores,
      },
      { status: 200 },
    );
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        message: "Fetch failed!",
      },
      { status: 400 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ integId: string }>;
  },
) {
  try {
    const { integId } = await params;
    const body = await req.json();

    if (!integId) {
      throw new Error("No integration ID found!");
    }

    if (!body.storeId) {
      throw new Error("No store ID to be updated!");
    }
    const res = await LoyverseIntegrationController.update({
      updates: [{ integId: Number(integId), storeId: body.storeId }],
      keyFields: ["integId"],
    });

    if (!res.success) {
      throw new Error("Failed to update store ID!");
    }

    return NextResponse.json(
      {
        success: res.success,
        message: res.message,
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
