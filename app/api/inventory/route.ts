import { getInventory } from "@/controllers/InventoryController";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await getInventory({});

    if (!res.success) {
      // propagate the actual message if available

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
        message: "Failed to fetched inventory!",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
