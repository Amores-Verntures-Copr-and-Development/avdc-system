import {
  getPlatformSettingsController,
  updatePlatformSettingsController,
} from "@/controllers/PlatformSettingsController";
import { UpdatePlatformSettingsDto } from "@/dtos/platformSettings.dto";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { NextRequest, NextResponse } from "next/server";

function errorStatus(err: any): number {
  if (err?.message === "Unauthorized") return 401;
  if (err?.message === "Only Super Admin can manage platform settings")
    return 403;
  return 500;
}

export async function GET(request: NextRequest) {
  try {
    const actingUser = getCurrentUser(request);
    const res = await getPlatformSettingsController(actingUser);
    if (!res.success) {
      throw new Error(res.message);
    }

    return NextResponse.json(
      { success: true, message: res.message, data: res.data },
      { status: 200 },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err?.message || "Failed to fetch platform settings!",
        error: err?.message || String(err),
      },
      { status: errorStatus(err) },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const actingUser = getCurrentUser(request);
    const data = (await request.json()) as UpdatePlatformSettingsDto;

    const res = await updatePlatformSettingsController(data, actingUser);
    if (!res.success) {
      throw new Error(res.message);
    }

    return NextResponse.json(
      { success: true, message: res.message, data: res.data },
      { status: 200 },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err?.message || "Failed to update platform settings!",
        error: err?.message || String(err),
      },
      { status: errorStatus(err) },
    );
  }
}
