import {
  deleteCustomerAddressById,
  updateCustomerAddressById,
} from "@/controllers/CustomerAddressController";
import { UpdateCustomerAddressDto } from "@/dtos/customerAddress.dto";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; addressId: string }> },
) {
  try {
    const { id: customerId, addressId } = await params;
    const body = (await request.json()) as UpdateCustomerAddressDto;

    const res = await updateCustomerAddressById({
      customerId: Number(customerId),
      addressId: Number(addressId),
      data: body,
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
        message: err?.message || "Failed to update address!",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; addressId: string }> },
) {
  try {
    const { id: customerId, addressId } = await params;

    const res = await deleteCustomerAddressById({
      customerId: Number(customerId),
      addressId: Number(addressId),
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
        message: err?.message || "Failed to remove address!",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
