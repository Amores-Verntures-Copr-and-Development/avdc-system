import {
  createOrderCompositeController,
  getOrderCompositeByPOItemController,
} from "@/controllers/OrderCompositeController";
import { CreateOrderCompositeItemDro } from "@/dtos/purchase.dto";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ poId: string }> },
) {
  try {
    const compositeData =
      (await request.json()) as CreateOrderCompositeItemDro[];

    const slug = (await params).poId;
    const poId = Number(slug);
    if (!poId) {
      throw new Error("No poId found!");
    }
    const res = await createOrderCompositeController(compositeData);
    if (!res.success) {
      console.log(res.error);
      throw new Error(res.message);
    }
    return NextResponse.json(
      {
        success: true,
        message: res.message,
      },
      { status: 201 },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err?.message || String(err),
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ poId: string; poItemId: string }> },
) {
  try {
    const slug = (await params).poId;
    const poId = Number(slug);
    const slug2 = (await params).poItemId;
    const poItemId = Number(slug2);
    if (!poId) {
      throw new Error("No poId found!");
    }
    if (!poItemId) {
      throw new Error("No poItemId found!");
    }
    const res = await getOrderCompositeByPOItemController(poItemId);
    if (!res.success) {
      console.log(res.error);
      throw new Error(res.message);
    }
    return NextResponse.json(
      {
        success: true,
        message: res.message,
        data: res.data,
      },
      { status: 200 },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err?.message || String(err),
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
