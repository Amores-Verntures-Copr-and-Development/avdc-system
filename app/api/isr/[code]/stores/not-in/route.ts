import { ISRStoreController } from "@/controllers/ISRController";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await params;
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get("limit") || "";
    const search = searchParams.get("search") || "";
    const res = await ISRStoreController.getStoreNotInISR({
      keyFields: { isrCode: code },
      limit: Number(limit) || 10,
      search,
    });

    if (!res.success) {
      throw new Error("Error while fetching!");
    }
    return NextResponse.json(
      {
        success: true,
        data: res.data,
      },
      { status: 200 },
    );
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        error: e,
      },
      { status: 400 },
    );
  }
}
