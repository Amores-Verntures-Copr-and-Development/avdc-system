import { createCustomer, getCustomer } from "@/controllers/CustomerController";
import { CreateCustomerDto } from "@/dtos/customer.dto";
import { NextResponse } from "next/server";

export async function POST(_request: Request) {
  try {
    const data = (await _request.json()) as CreateCustomerDto[];
    const res = await createCustomer(data);
    if (!res.success) {
      console.log(res.message);
      throw new Error(`${res.error}`);
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

export async function GET(_request: Request) {
  try {
    const { searchParams } = new URL(_request.url);
    const search = searchParams.get("search") || "";
    const limit = searchParams.get("limit") || "";
    const page = searchParams.get("page") || "";
    const type = searchParams.get("type") || "";
    const store = searchParams.get("store") || "";

    const limitNumber = Number(limit) || 100;
    const pageNumber = Number(page) || 1;
    const res = await getCustomer({
      keyFields: {},
      limit: limitNumber,
      offset: limitNumber * (pageNumber - 1),
      search,
      type,
    });

    if (!res.success) {
      // propagate the actual message if available
      console.log(res.error);
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
