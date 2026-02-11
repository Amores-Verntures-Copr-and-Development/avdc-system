import { getRequest } from "@/controllers/RequestController";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    // const status = searchParams.get("status") || "";
    // const category = searchParams.get("category") || "";
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";
    // const limit = searchParams.get("limit") || "";
    // const page = searchParams.get("page") || "";
    const store = searchParams.get("store") || "";
    // const limitNumber = Number(limit) || 100;
    // const pageNumber = Number(page) || 1;
    console.log({ search, from, to, store });
    const res = await getRequest({});
    if (!res.success) {
      console.log(res.error);
      throw new Error(res.message || "Failed to create request");
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
    console.error("POST /api/auth/users error:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create request",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
