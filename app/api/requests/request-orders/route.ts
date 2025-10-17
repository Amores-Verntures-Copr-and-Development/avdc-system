import { getRequest } from "@/controllers/RequestController";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
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
      { status: 201 }
    );
  } catch (err: any) {
    console.error("POST /api/auth/users error:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create request",
        error: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
