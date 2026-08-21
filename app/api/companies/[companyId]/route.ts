import {
  getCompanyByIdController,
  updateCompanyController,
} from "@/controllers/CompanyController";
import { UpdateCompanyDto } from "@/dtos/company.dto";
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
    const res = await getCompanyByIdController(companyId, actingUser);
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
        message: err?.message || "Failed to fetch company!",
        error: err?.message || String(err),
      },
      { status: errorStatus(err) },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> },
) {
  try {
    const companyId = Number((await params).companyId);
    if (!companyId) {
      throw new Error("No company found");
    }

    const actingUser = getCurrentUser(request);
    const body = (await request.json()) as Omit<UpdateCompanyDto, "companyId">;
    const data: UpdateCompanyDto = { ...body, companyId };

    const res = await updateCompanyController(data, actingUser);
    if (!res.success) {
      throw new Error(res.message);
    }

    return NextResponse.json(
      { success: true, message: res.message },
      { status: 200 },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err?.message || "Failed to update company!",
        error: err?.message || String(err),
      },
      { status: errorStatus(err) },
    );
  }
}
