import { createCustomerMultipleStore } from "@/controllers/CustomerController";
import { NextResponse } from "next/server";

export async function POST(_request: Request) {
  try {
    const { data, store } = await _request.json();
    const res = await createCustomerMultipleStore(data, store);
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
        message: err?.message || String(err),
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
