import { getUserInfo, updateUserInfoController } from "@/controllers/UserControllers";
import { UpdateUserInfoDto } from "@/dtos/user.dto";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const slug = (await params).userId;
    const res = await getUserInfo(Number(slug));
    if (!res.success) {
      throw new Error("Failed fetched user info!");
    }
    return NextResponse.json({
      success: true,
      message: res.message,
      data: res.data,
    });
  } catch (e) {
    console.log(e);
    return NextResponse.json({
      success: false,
      message: "Failed fetched user info!",
      error: e,
    });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const userId = Number((await params).userId);
    const actingUser = getCurrentUser(request);

    const data = (await request.json()) as UpdateUserInfoDto;

    if (!data.userFname?.trim() || !data.userLname?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "First name and last name are required.",
        },
        { status: 400 },
      );
    }

    const res = await updateUserInfoController({ userId, data, actingUser });
    if (!res.success) {
      throw new Error(res.message);
    }

    return NextResponse.json({
      success: true,
      message: res.message,
      data: res.data,
    });
  } catch (err: any) {
    const isAuthError = err?.message === "Unauthorized";
    const isForbidden = err?.message?.includes("Only Owner or Admin");

    return NextResponse.json(
      {
        success: false,
        message: err?.message || "Failed to update profile",
        error: err?.message || String(err),
      },
      { status: isAuthError ? 401 : isForbidden ? 403 : 500 },
    );
  }
}
