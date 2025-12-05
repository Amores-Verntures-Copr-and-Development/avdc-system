import { getItemByFields } from "@/controllers/ItemController";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ itemName: string }> }
) {
  try {
    const slug = (await params).itemName;
    const itemName = slug;
    const res = await getItemByFields({ keyFields: { itemName: itemName } });
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
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetched item!",
        error: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
