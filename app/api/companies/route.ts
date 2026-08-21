import {
  createCompanyController,
  getCompaniesController,
} from "@/controllers/CompanyController";
import { CreateCompanyDto } from "@/dtos/company.dto";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { NextRequest, NextResponse } from "next/server";

function errorStatus(err: any): number {
  if (err?.message === "Unauthorized") return 401;
  if (err?.message === "Only Super Admin can manage companies") return 403;
  return 500;
}

export async function GET(request: NextRequest) {
  try {
    const actingUser = getCurrentUser(request);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const res = await getCompaniesController(actingUser, search);
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
        message: err?.message || "Failed to fetch companies!",
        error: err?.message || String(err),
      },
      { status: errorStatus(err) },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const actingUser = getCurrentUser(request);
    const body = (await request.json()) as Omit<
      CreateCompanyDto,
      "companyCreatedBy"
    >;
    const data: CreateCompanyDto = {
      ...body,
      companyCreatedBy: actingUser.userId,
    };

    const res = await createCompanyController(data, actingUser);
    if (!res.success) {
      throw new Error(res.message);
    }

    return NextResponse.json(
      { success: true, message: res.message, data: res.data },
      { status: 201 },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err?.message || "Failed to create company!",
        error: err?.message || String(err),
      },
      { status: errorStatus(err) },
    );
  }
}
