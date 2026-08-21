import { getCompanyOwnersController } from "@/controllers/CompanyController";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { NextRequest, NextResponse } from "next/server";

function errorStatus(err: any): number {
  if (err?.message === "Unauthorized") return 401;
  if (err?.message === "Only Super Admin can manage companies") return 403;
  return 500;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> },
) {
  try {
    const companyId = Number((await params).companyId);
    if (!companyId) {
      throw new Error("No company found");
    }

    const actingUser = getCurrentUser(request);
    const res = await getCompanyOwnersController(companyId, actingUser);
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
        message: err?.message || "Failed to fetch company owners!",
        error: err?.message || String(err),
      },
      { status: errorStatus(err) },
    );
  }
}
