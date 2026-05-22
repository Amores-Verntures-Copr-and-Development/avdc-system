import { getStore } from "@/controllers/StoreControllers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const storeName = searchParams.get("storeName") || "";

    const res = await getStore({
      search,
      limit: 10,
      skip: 0,
      keyfields: { storeName: storeName },
    });
    if (!res.success) {
      // propagate the actual message if available
      throw new Error("Failed to fetch user");
    }
    return NextResponse.json({
      success: true,
      message: res.message,
      data: res.data, // could sanitize before returning
    });
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
