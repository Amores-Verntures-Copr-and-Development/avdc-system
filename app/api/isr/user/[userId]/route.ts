import { ISRController } from "@/controllers/ISRController";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;
    const res = await ISRController.getISRUserInfo(Number(userId));

    if (!res.success) {
      throw new Error("Error");
    }
    return NextResponse.json(
      {
        success: res.success,
        data: res.data,
      },
      {
        status: 200,
      },
    );
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        error: e,
      },
      {
        status: 400,
      },
    );
  }
}
