import { CreateUserDto } from "@/dtos/user.dto";
import { createUser, getUsers } from "@/controllers/UserControllers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const data = (await request.json()) as CreateUserDto;

    const res = await createUser(data);

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
        message: "User add failed!",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const res = await getUsers({ search });

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
    console.error("POST /api/auth/users error:", err);
    return NextResponse.json(
      {
        success: false,
        message: "User add failed!",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
