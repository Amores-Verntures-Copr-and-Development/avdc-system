import { CreateUserDto } from "@/dtos/user.dto";
import { createUser, getUsers } from "@/controllers/UserControllers";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { NextRequest, NextResponse } from "next/server";

function errorStatus(err: any): number {
  if (err?.message === "Unauthorized") return 401;
  if (err?.message?.startsWith("Only Owner or Admin can")) return 403;
  return 500;
}

export async function POST(request: NextRequest) {
  try {
    const actingUser = getCurrentUser(request);
    const data = (await request.json()) as CreateUserDto;

    const res = await createUser(data, actingUser);

    if (!res.success) {
      // propagate the actual message if available
      console.log(res.error);
      throw new Error(res.message || "Failed to insert user");
    }

    return NextResponse.json(
      {
        success: true,
        message: "User added successfully!",
        data: res, // could sanitize before returning
      },
      { status: 201 },
    );
  } catch (err: any) {
    console.error("POST /api/auth/users error:", err);
    return NextResponse.json(
      {
        success: false,
        message: err?.message || "User add failed!",
        error: err?.message || String(err),
      },
      { status: errorStatus(err) },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const actingUser = getCurrentUser(request);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const companyIdParam = searchParams.get("companyId");
    const companyId = companyIdParam ? Number(companyIdParam) : undefined;
    const res = await getUsers({ search, companyId, actingUser });

    if (!res.success) {
      throw new Error("Failed to insert user");
    }

    return NextResponse.json(
      {
        success: true,
        message: res.message,
        data: res.data, // could sanitize before returning
      },
      { status: 201 },
    );
  } catch (err: any) {
    console.error("GET /api/users error:", err);
    return NextResponse.json(
      {
        success: false,
        message: err?.message || "Failed to fetch users!",
        error: err?.message || String(err),
      },
      { status: errorStatus(err) },
    );
  }
}
