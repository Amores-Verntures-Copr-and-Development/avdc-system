import { getCategories } from "@/controllers/CategoryController";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ type: string }> },
) {
  try {
    const type = (await params).type;
    console.log({ type });
    const res = await getCategories({ controller: null });

    if (!res.success) {
      // propagate the actual message if available
      console.log(res.message);
      throw new Error(`${res.message ?? "Failed to fetch category"}`);
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
        message: "User add failed!",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
