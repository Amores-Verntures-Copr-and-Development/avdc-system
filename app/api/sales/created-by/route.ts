import { getSalesCreators } from "@/controllers/SaleController";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeIdParam = searchParams.get("storeId");
    const storeId = storeIdParam ? Number(storeIdParam) : undefined;

    const res = await getSalesCreators({ storeId });

    if (!res.success) {
      throw new Error(`${res.error}`);
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
        message: "Failed to fetch sales creators!",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
