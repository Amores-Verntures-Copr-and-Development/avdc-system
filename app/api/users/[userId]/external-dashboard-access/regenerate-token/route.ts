import { regenerateToken } from "@/controllers/ExternalDashboardAccessController";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId: userIdSlug } = await params;
    const userId = Number(userIdSlug);

    if (!userId) {
      throw new Error("No user id found");
    }

    const actingUser = getCurrentUser(request);
    const res = await regenerateToken(userId, actingUser);

    if (!res.success) {
      throw new Error(res.message || "Failed to regenerate token");
    }

    return NextResponse.json(
      { success: true, message: res.message, data: res.data },
      { status: 200 },
    );
  } catch (e: any) {
    const isAuthError = e?.message === "Unauthorized";
    const isForbidden = e?.message?.includes("Only Owner or Admin");

    return NextResponse.json(
      {
        success: false,
        message: e?.message,
        error: e?.message || String(e),
      },
      { status: isAuthError ? 401 : isForbidden ? 403 : 500 },
    );
  }
}
