import { CreateStoreDto } from "@/dtos/store.dto";
import { createStore, getStore } from "@/controllers/StoreControllers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const data = (await request.json()) as CreateStoreDto;

    const res = await createStore(data);

    if (!res.success) {
      // propagate the actual message if available
      console.log(res.error);
      throw new Error(res.message || "Failed to create store");
    }

    return NextResponse.json(
      {
        success: true,
        message: "Store added successfully!",
        data: res, // could sanitize before returning
      },
      { status: 201 },
    );
  } catch (err: any) {
    console.error("POST /api/auth/users error:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Store add failed!",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const res = await getStore({});

    if (!res.success) {
      // propagate the actual message if available
      console.log(res.error);
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
