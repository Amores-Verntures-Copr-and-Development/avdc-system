import {
  addCustomerAddress,
  getCustomerAddresses,
} from "@/controllers/CustomerAddressController";
import { CreateCustomerAddressDto } from "@/dtos/customerAddress.dto";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: customerId } = await params;

    const res = await getCustomerAddresses({
      customerId: Number(customerId),
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
        message: "Failed to fetch addresses!",
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
    const body = (await request.json()) as Omit<
      CreateCustomerAddressDto,
      "customerId"
    >;

    const data: CreateCustomerAddressDto = {
      ...body,
      customerId: Number(customerId),
    };

    if (!data.label || !data.street || !data.barangay || !data.city || !data.province) {
      throw new Error("label, street, barangay, city, and province are required");
    }

    const res = await addCustomerAddress(data);

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
        message: err?.message || "Failed to add address!",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
