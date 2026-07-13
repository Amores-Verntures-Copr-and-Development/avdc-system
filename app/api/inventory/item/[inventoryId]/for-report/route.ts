import { getInventoryItemsByDate } from "@/controllers/InventoryController";

import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ inventoryId: string }> },
) {
  try {
    const slug = (await params).inventoryId;
    const inventoryId = Number(slug);
    const { searchParams } = new URL(_request.url);
    const fromParam = searchParams.get("from") || "";
    const toParam = searchParams.get("to") || "";

    const from = fromParam ? `${fromParam} 00:00:00` : "";
    const to = toParam ? `${toParam} 23:59:59` : "";

    const res = await getInventoryItemsByDate({
      inventoryId,
      range: { from: from, to: to },
    });

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
        message: "Failed to fetched inventory!",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
