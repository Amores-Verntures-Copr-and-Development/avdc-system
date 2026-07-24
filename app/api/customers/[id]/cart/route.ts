import {
  addCustomerCartItem,
  clearCustomerCart,
  getCustomerCart,
} from "@/controllers/CustomerCartController";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: customerId } = await params;
    const res = await getCustomerCart({ customerId: Number(customerId) });

    if (!res.success) {
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
        message: "Failed to fetch cart!",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: customerId } = await params;
    const body = await request.json();

    const res = await addCustomerCartItem({
      customerId: Number(customerId),
      prodVarId: Number(body.prodVarId),
      cartQuantity: Number(body.cartQuantity) || 1,
    });

    if (!res.success) {
      throw new Error(res.message);
    }

    return NextResponse.json(
      {
        success: true,
        message: res.message,
        data: res.data,
      },
      { status: 201 },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to add item to cart!",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: customerId } = await params;

    const res = await clearCustomerCart({ customerId: Number(customerId) });

    if (!res.success) {
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
        message: "Failed to clear cart!",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
