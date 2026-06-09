import {
  getCustomer,
  updateCustomerController,
} from "@/controllers/CustomerController";
import { Customer } from "@/types/customer";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const res = await getCustomer({
      keyFields: { customerId: Number(id) },
    });
    if (!res.success) {
      throw new Error(res.message);
    }
    return NextResponse.json(
      {
        success: true,
        message: res.message,
        data: res.data,
        count: res.count, // could sanitize before returning
      },
      { status: 201 },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Items import failed!",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "No ID provided!",
          error: "No ID provided",
        },
        { status: 500 },
      );
    }
    const body = (await request.json()) as Partial<Customer>;
    const res = await updateCustomerController({
      keyFields: ["customerId"],
      updateData: [body],
    });
    if (!res.success) {
      throw new Error(res.message);
    }
    return NextResponse.json(
      {
        success: true,
        message: res.message,
        data: res.data, // could sanitize before returning
      },
      { status: 201 },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Items import failed!",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
