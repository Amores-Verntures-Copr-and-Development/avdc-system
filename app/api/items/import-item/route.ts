import { importItems } from "@/controllers/ItemController";
import { ImportItemInfo } from "@/dtos/items.dto";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const data = (await request.json()) as ImportItemInfo;

    const res = await importItems(data);

    if (!res.success) {
      // propagate the actual message if available
      console.log(res.error);
      throw new Error(res.message);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Items imported successfully!",
        // data: res, // could sanitize before returning
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Items import failed!",
        error: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
