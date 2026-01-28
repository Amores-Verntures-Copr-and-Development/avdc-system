import { createCustomer, getCustomer } from "@/controllers/CustomerController";
import { CreateCustomerDto } from "@/dtos/customer.dto";
import { NextResponse } from "next/server";

export async function POST(_request: Request) {
  try {
    const data = (await _request.json()) as CreateCustomerDto;
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
    // const search = searchParams.get("search") || "";
    // console.log({ search });
    const res = await getCustomer({
      keyFields: {},
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
