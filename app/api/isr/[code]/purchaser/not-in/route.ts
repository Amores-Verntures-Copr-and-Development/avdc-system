import { getUserNotInISRPurchaserController } from "@/controllers/UserControllers";
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
    const res = await getUserNotInISRPurchaserController({
      keyFields: { isrCode: code },
      limit: Number(limit) || 10,
      search,
    });
    return NextResponse.json(
      {
        success: true,
        data: res,
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
