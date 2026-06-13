import { getItemConversions } from "@/controllers/ItemController";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ itemId: string; inventoryId: string }> },
) {
  try {
    const { itemId, inventoryId } = await params;

    if (!itemId) {
      throw new Error("No item ID found!");
    }
    if (!inventoryId) {
      throw new Error("No item ID found!");
    }

    const res = await getItemConversions({
      keyFields: { fromItemId: Number(itemId) },
      inventoryId: Number(inventoryId),
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
