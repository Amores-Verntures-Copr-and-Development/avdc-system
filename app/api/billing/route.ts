import { getMyCompanyBillingController } from "@/controllers/BillingController";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { NextRequest, NextResponse } from "next/server";

function errorStatus(err: any): number {
  if (err?.message === "Unauthorized") return 401;
  if (err?.message === "Only the Company Owner can view billing") return 403;
  return 500;
}

export async function GET(request: NextRequest) {
  try {
    const actingUser = getCurrentUser(request);
    const res = await getMyCompanyBillingController(actingUser);
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
        message: err?.message || "Failed to fetch billing!",
        error: err?.message || String(err),
      },
      { status: errorStatus(err) },
    );
  }
}
