// app/api/auth/update-token/route.ts
import { NextRequest, NextResponse } from "next/server";
import { generateTokens } from "@/utils/jwt";
import jwt from "jsonwebtoken";
export async function PUT(req: NextRequest) {
  try {
    // 1. Get current token from cookies
    const accessToken = req.cookies.get("avdc_accessToken")?.value;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: "No access token" },
        { status: 401 }
      );
    }

    // 2. Verify current token
    const decoded = jwt.verify(accessToken, process.env.SECRET_KEY!) as {
      userId: number;
      userRole: string;
      userFullName: string;
      userLname: string;
      userFname: string;
      empPosition: number;
      storeId: number | null;
    };
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    // 3. Get new storeId from request body
    const { storeId } = await req.json();

    if (!storeId || typeof storeId !== "number") {
      return NextResponse.json(
        { success: false, message: "Valid storeId is required" },
        { status: 400 }
      );
    }

    // 4. Generate NEW tokens with updated storeId
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      generateTokens(
        decoded.userId,
        decoded.userFname,
        decoded.userLname,
        decoded.userRole,
        decoded.empPosition,
        storeId // Updated storeId!
      );

    // 5. Update user in database with new storeId (optional)
    // await updateUserStore(decoded.userId, storeId);

    const response = NextResponse.json({
      success: true,
      message: "Token updated with store selection",
      user: {
        ...decoded,
        storeId, // Return updated storeId
      },
    });

    // 6. Set updated cookies
    response.cookies.set({
      name: "avdc_accessToken",
      value: newAccessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60, // 1 hour
    });

    response.cookies.set({
      name: "avdc_refreshToken",
      value: newRefreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (err: unknown) {
    console.error("Token update error:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
