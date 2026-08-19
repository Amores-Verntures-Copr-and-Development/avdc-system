import {
  getStore,
  updateStoreFeaturesController,
} from "@/controllers/StoreControllers";
import { UpdateStoreFeaturesDto } from "@/dtos/store.dto";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
  } catch (e) {}
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> },
) {
  try {
    const storeId = Number((await params).storeId);

    const res = await getStore({ keyfields: { storeId } });
    if (!res.success) {
      throw new Error(res.message);
    }

    return NextResponse.json({
      success: true,
      message: res.message,
      data: res.data,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err?.message || "Failed to fetch store!",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> },
) {
  try {
    const storeId = Number((await params).storeId);
    const actingUser = getCurrentUser(request);
    const data = (await request.json()) as UpdateStoreFeaturesDto;

    const res = await updateStoreFeaturesController({
      storeId,
      data,
      actingUser,
    });

    if (!res.success) {
      throw new Error(res.message);
    }

    return NextResponse.json({
      success: true,
      message: res.message,
    });
  } catch (err: any) {
    const isAuthError = err?.message === "Unauthorized";
    const isForbidden = err?.message?.includes("Only Owner or Admin");

    return NextResponse.json(
      {
        success: false,
        message: err?.message || "Failed to update store!",
        error: err?.message || String(err),
      },
      { status: isAuthError ? 401 : isForbidden ? 403 : 500 },
    );
  }
}
