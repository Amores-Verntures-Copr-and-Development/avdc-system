// app/api/auth/update-token/route.ts
import { NextRequest, NextResponse } from "next/server";
import { generateTokens } from "@/utils/jwt";
import { getStoresByEmployeeByUserId } from "@/controllers/StoreControllers";
import { selectStoreCompanyId } from "@/models/storeModels";
import jwt from "jsonwebtoken";
export async function PUT(req: NextRequest) {
  try {
    // 1. Get current token from cookies
    const accessToken = req.cookies.get("avdc_accessToken")?.value;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: "No access token" },
        { status: 401 },
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
      companyId: number | null;
    };
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 },
      );
    }

    // 3. Get new storeId from request body
    const { storeId } = await req.json();

    if (!storeId || typeof storeId !== "number") {
      return NextResponse.json(
        { success: false, message: "Valid storeId is required" },
        { status: 400 },
      );
    }

    // 3b. Verify the caller is actually allowed to switch to this store -
    // owner/admin manage every store *in their own company*; superadmin
    // manages every store platform-wide; anyone else must have an employee
    // assignment for it. Without this check, any authenticated user
    // (including "staff", or an owner/admin from a different client
    // company) could mint themselves a valid cookie claiming any storeId,
    // regardless of what they're actually assigned to or which company it
    // belongs to.
    const storeCompanyId = await selectStoreCompanyId(storeId);

    if (storeCompanyId === null) {
      return NextResponse.json(
        { success: false, message: "Store not found" },
        { status: 404 },
      );
    }

    if (
      decoded.userRole !== "superadmin" &&
      storeCompanyId !== decoded.companyId
    ) {
      return NextResponse.json(
        { success: false, message: "You do not have access to this store" },
        { status: 403 },
      );
    }

    const isCompanyUnrestricted =
      decoded.userRole === "superadmin" ||
      decoded.userRole === "owner" ||
      (decoded as unknown as { empPosition?: string }).empPosition ===
        "admin";

    if (!isCompanyUnrestricted) {
      const membership = await getStoresByEmployeeByUserId(decoded.userId);
      const allowedStoreIds = Array.isArray(membership.data)
        ? membership.data.map((s: any) => s.storeId)
        : [];

      if (!allowedStoreIds.includes(storeId)) {
        return NextResponse.json(
          { success: false, message: "You are not assigned to this store" },
          { status: 403 },
        );
      }
    }

    // 4. Generate NEW tokens with updated storeId
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      generateTokens(
        decoded.userId,
        decoded.userFname,
        decoded.userLname,
        decoded.userRole,
        decoded.empPosition,
        storeId, // Updated storeId!
        decoded.companyId,
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
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    response.cookies.set({
      name: "avdc_refreshToken",
      value: newRefreshToken,
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
