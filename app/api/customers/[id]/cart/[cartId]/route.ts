import {
  deleteCustomerCartItem,
  updateCustomerCartItem,
} from "@/controllers/CustomerCartController";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cartId: string }> },
) {
  try {
    const { id: customerId, cartId } = await params;
    const body = await request.json();

    const res = await updateCustomerCartItem({
      customerId: Number(customerId),
      cartId: Number(cartId),
      data: { cartQuantity: Number(body.cartQuantity) },
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
      { status: 200 },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update cart item!",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; cartId: string }> },
) {
  try {
    const { id: customerId, cartId } = await params;

    const res = await deleteCustomerCartItem({
      customerId: Number(customerId),
      cartId: Number(cartId),
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
      { status: 200 },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to remove cart item!",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
