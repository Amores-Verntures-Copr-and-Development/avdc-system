import { resetUserPasswordController } from "@/controllers/UserControllers";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
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
    const { newPassword } = (await request.json()) as {
      newPassword?: string;
    };

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message: "New password must be at least 8 characters.",
        },
        { status: 400 },
      );
    }

    const res = await resetUserPasswordController({
      userId,
      newPassword,
      actingUser,
    });

    if (!res.success) {
      throw new Error(res.message || "Failed to reset password");
    }

    return NextResponse.json(
      { success: true, message: res.message },
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
