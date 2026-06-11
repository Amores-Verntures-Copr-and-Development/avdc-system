import { NextRequest, NextResponse } from "next/server";
import { getCode } from "../../purchaser/route";
import { ISRStoreController } from "@/controllers/ISRController";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ code: string; isrStoreId: string }> },
) {
  try {
    await getCode(params);
    const { isrStoreId } = await params;

    const res = await ISRStoreController.deleteISRStoresByID(
      Number(isrStoreId),
    );

    if (!res.success) {
      throw new Error(res.message);
    }

    return NextResponse.json(
      {
        success: res.success,
        message: res.message,
      },
      {
        status: 200,
      },
    );
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to remove ISR Store",
      },
      {
        status: 400,
      },
    );
  }
}
