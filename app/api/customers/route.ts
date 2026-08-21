import { createCustomer, getCustomer } from "@/controllers/CustomerController";
import { CreateCustomerDto } from "@/dtos/customer.dto";
import { NextResponse } from "next/server";

export async function POST(_request: Request) {
  try {
    const data = (await _request.json()) as CreateCustomerDto[];
    const res = await createCustomer(data);
    if (!res.success) {
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
    const fromParam = searchParams.get("from") || "";
    const toParam = searchParams.get("to") || "";
    const sort = searchParams.get("sort") || "";
    const rawOrder = searchParams.get("order");
    const paymentMethods = searchParams.getAll("paymentMethod");

    const from = fromParam ? `${fromParam} 00:00:00` : "";
    const to = toParam ? `${toParam} 23:59:59` : "";
    const order: "asc" | "desc" | undefined =
      rawOrder === "asc" || rawOrder === "desc" ? rawOrder : undefined;

    const limitNumber = Number(limit) || 100;
    const pageNumber = Number(page) || 1;
    const res = await getCustomer({
      keyFields: {},
      limit: limitNumber,
      offset: limitNumber * (pageNumber - 1),
      search,
      type,
      store,
      from,
      to,
      sort,
      order,
      paymentMethods,
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
