import { CreateItemConversionDto } from "@/dtos/items.dto";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ itemName: string }> }
) {
  try {
    const data = (await _request.json()) as CreateItemConversionDto;

    // const res = await importItems(data);

    // if (!res.success) {
    //   // propagate the actual message if available
    //   console.log(res.error);
    //   throw new Error(res.message);
    // }

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
