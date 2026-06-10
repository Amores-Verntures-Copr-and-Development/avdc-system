import { NextRequest, NextResponse } from "next/server";

import { deleteISRPurcahserByID } from "@/services/isr/isr-purchaser/delete-isr-purchaser";
import {
  ISRPurchaserController,
  ISRRequestHandlerController,
} from "@/controllers/ISRController";
import { getCode } from "../../purchaser/route";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ code: string; isrReqHanId: number }> },
) {
  try {
    await getCode(params);

    const { isrReqHanId } = await params;

    const res = await ISRRequestHandlerController.deleteISRRequestHandlerByID(
      Number(isrReqHanId),
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
        message: "Failed to remove ISR Request Handler",
      },
      {
        status: 400,
      },
    );
  }
}
