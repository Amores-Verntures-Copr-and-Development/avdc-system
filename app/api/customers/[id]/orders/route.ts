import { getOrderController } from "@/controllers/OrderController";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const customerId = Number(id);

    if (!customerId) {
      throw new Error("No customer found");
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const limit = searchParams.get("limit") || "";
    const page = searchParams.get("page") || "";
    const limitNumber = Number(limit) || 100;
    const pageNumber = Number(page) || 1;

    const res = await getOrderController({
      keyFields: { customerId },
      search,
      limit: limitNumber,
      offset: limitNumber * (pageNumber - 1),
    });
    console.log({ res });
    if (!res.success) {
      throw new Error(`${res.error}`);
    }

    return NextResponse.json(
      {
        success: true,
        message: res.message,
        data: res.data,
        count: res.count,
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.log({ err });
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch customer orders!",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
