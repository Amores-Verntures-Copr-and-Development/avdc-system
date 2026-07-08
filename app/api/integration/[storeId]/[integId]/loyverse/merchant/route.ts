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

    const merchantRes = await fetch("https://api.loyverse.com/v1.0/merchant", {
      headers: {
        Authorization: `Bearer ${integration.accessToken}`,
        Accept: "application/json",
      },
    });

    const merchantData = await merchantRes.json();

    if (!merchantRes.ok) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to fetch Loyverse merchant",
          error: merchantData,
        },
        { status: merchantRes.status },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Fetched successfully!",
        data: [merchantData],
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

    if (!body.merchantId) {
      throw new Error("No merchant ID to be updated!");
    }
    const res = await LoyverseIntegrationController.update({
      updates: [{ integId: Number(integId), merchantId: body.merchantId }],
      keyFields: ["integId"],
    });

    if (!res.success) {
      throw new Error("Failed to update merchant ID!");
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
