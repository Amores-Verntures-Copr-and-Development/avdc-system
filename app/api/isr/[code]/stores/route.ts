import {
  ISRController,
  ISRPurchaserController,
  ISRRequestHandlerController,
  ISRStoreController,
} from "@/controllers/ISRController";
import {
  CreateISRPurchaserDto,
  CreateISRRequestHandlerDto,
  CreateISRStoreDto,
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

    const data = (await req.json()) as CreateISRStoreDto;
    if (!code) {
      throw new Error("Missing ISR code!");
    }
    if (!data) {
      throw new Error("No data found!");
    }
    const res = await ISRStoreController.createISRStore({
      data: data,
    });

    if (!res.success) {
      throw new Error("Failed to add store  in ISR");
    }
    return NextResponse.json(
      {
        success: true,
        message: "ISR Store added successfully!",
      },
      {
        status: 201,
      },
    );
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        message: `Failed to add store  in ISR`,
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

    const res = await ISRStoreController.getISRStores({
      code: code,
      keyFields: {
        isrStoreDeletedAt: null,
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
