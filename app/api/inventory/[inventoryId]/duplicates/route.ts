import { getInventoryDuplicatesController } from "@/controllers/InventoryController";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ inventoryId: string }> },
) {
  try {
    const { inventoryId } = await params;

    if (!inventoryId) {
      throw new Error("No inventory ID found!");
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const limit = searchParams.get("limit") || "";
    const page = searchParams.get("page") || "";
    const limitNumber = Number(limit) || 50;
    const pageNumber = Number(page) || 1;

    const res = await getInventoryDuplicatesController({
      inventoryId: Number(inventoryId),
      search,
      limit: limitNumber,
      skip: (pageNumber - 1) * limitNumber,
    });

    if (!res.success) {
      throw new Error(res.message);
    }

    return NextResponse.json(
      {
        success: true,
        data: res.data,
        message: "Good",
        count: res.count,
      },
      { status: 200 },
    );
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch!",
      },
      { status: 500 },
    );
  }
}
