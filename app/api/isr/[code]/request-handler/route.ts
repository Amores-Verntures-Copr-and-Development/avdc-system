import {
  ISRController,
  ISRPurchaserController,
  ISRRequestHandlerController,
} from "@/controllers/ISRController";
import {
  CreateISRPurchaserDto,
  CreateISRRequestHandlerDto,
} from "@/dtos/isr.dto";
import { NextRequest, NextResponse } from "next/server";

const getCode = async (params: Promise<{ code: string }>): Promise<string> => {
  const { code } = await params;

  if (!code) {
    throw new Error("Missing ISR code!");
  }

  return code;
};
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const code = await getCode(params);

    const data = (await req.json()) as CreateISRRequestHandlerDto;
    if (!code) {
      throw new Error("Missing ISR code!");
    }
    if (!data) {
      throw new Error("No data found!");
    }
    const res = await ISRRequestHandlerController.createISRRequestHandler({
      data: data,
    });

    if (!res.success) {
      throw new Error(`Failed to add request handler in ISR`);
    }
    return NextResponse.json(
      {
        success: true,
        message: "ISR Request Handler added successfully!",
      },
      {
        status: 201,
      },
    );
  } catch (e) {
    console.log({ e });
    return NextResponse.json(
      {
        success: false,
        message: `Failed to add request handler in ISR`,
      },
      { status: 400 },
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const code = await getCode(params);

    const res = await ISRRequestHandlerController.getISRRequestHandler({
      code: code,
      keyFields: { isrReqHanDeletedAt: null },
    });
    if (!res.success) {
      throw new Error("Failed to fetch!");
    }
    return NextResponse.json(
      {
        success: true,
        data: res.data,
        count: res.count,
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
