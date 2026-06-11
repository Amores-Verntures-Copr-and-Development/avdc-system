import { NextRequest, NextResponse } from "next/server";
import { getCode } from "../route";
import { deleteISRPurcahserByID } from "@/services/isr/isr-purchaser/delete-isr-purchaser";
import { ISRPurchaserController } from "@/controllers/ISRController";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string; isrPurId: string }> },
) {
  try {
    await getCode(params);
    const { isrPurId } = await params;

    const res = await ISRPurchaserController.deleteISRPurchaserByISRPurID(
      Number(isrPurId),
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
        message: "Failed to remove ISR Purchaser",
      },
      {
        status: 400,
      },
    );
  }
}
