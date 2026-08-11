import {
  getAccess,
  grantOrUpdateAccess,
  revokeAccess,
} from "@/controllers/ExternalDashboardAccessController";
import { GrantExternalDashboardAccessDto } from "@/dtos/externalDashboardAccess.dto";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId: userIdSlug } = await params;
    const userId = Number(userIdSlug);

    if (!userId) {
      throw new Error("No user id found");
    }

    const res = await getAccess(userId);

    if (!res.success) {
      throw new Error(res.message || "Failed to fetch external dashboard access");
    }

    return NextResponse.json(
      { success: true, message: res.message, data: res.data },
      { status: 200 },
    );
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        message: e?.message,
        error: e?.message || String(e),
      },
      { status: 500 },
    );
  }
}

export async function PUT(
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
    const body = (await request.json()) as Omit<
      GrantExternalDashboardAccessDto,
      "userId" | "edaCreatedBy"
    >;

    const data: GrantExternalDashboardAccessDto = {
      ...body,
      userId,
      edaCreatedBy: actingUser.userId,
    };

    const res = await grantOrUpdateAccess(data, actingUser);

    if (!res.success) {
      throw new Error(res.message || "Failed to grant external dashboard access");
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

export async function DELETE(
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
    const res = await revokeAccess(userId, actingUser);

    if (!res.success) {
      throw new Error(res.message || "Failed to revoke external dashboard access");
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
