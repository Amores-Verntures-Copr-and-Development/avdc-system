import { getCustomer } from "@/controllers/CustomerController";
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
