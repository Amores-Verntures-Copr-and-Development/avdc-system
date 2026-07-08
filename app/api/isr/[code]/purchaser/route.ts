import { ISRPurchaserController } from "@/controllers/ISRController";
import { CreateISRPurchaserDto } from "@/dtos/isr.dto";
import { NextRequest, NextResponse } from "next/server";

export const getCode = async (
  params: Promise<{ code: string }>,
): Promise<string> => {
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

    const data = (await req.json()) as CreateISRPurchaserDto;
    if (!code) {
      throw new Error("Missing ISR code!");
    }
    if (!data) {
      throw new Error("No data found!");
    }
    const res = await ISRPurchaserController.createISRPurchaser({ data: data });
    if (!res.success) {
      throw new Error(`Failed to add purchser in ISR`);
    }
    return NextResponse.json(
      {
        success: true,
        message: "ISR Purchaser added successfully!",
      },
      {
        status: 201,
      },
    );
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        message: `Failed to add purchser in ISR`,
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

    const res = await ISRPurchaserController.getISRPurchaser({
      code: code,
      keyFields: {
        isrPurDeletedAt: null,
      },
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
