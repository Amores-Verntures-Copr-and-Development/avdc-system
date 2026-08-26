import { getEmployees } from "@/controllers/UserControllers";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const actingUser = getCurrentUser(request);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const res = await getEmployees({ search, actingUser });

    if (!res.success) {
      throw new Error(res.message);
    }

    return NextResponse.json(
      {
        success: true,
        message: res.message,
        data: res.data,
      },
      { status: 200 },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err?.message || "Failed to fetch employees!",
        error: err?.message || String(err),
      },
      { status: err?.message === "Unauthorized" ? 401 : 500 },
    );
  }
}
