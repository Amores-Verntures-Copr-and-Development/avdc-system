import { CreateStoreDto } from "@/dtos/store.dto";
import { createStore, getStore } from "@/controllers/StoreControllers";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { NextRequest, NextResponse } from "next/server";

function errorStatus(err: any): number {
  if (err?.message === "Unauthorized") return 401;
  if (err?.message === "Store limit reached. Please ask your Super Admin to increase your maximum store limit.")
    return 403;
  if (err?.message?.startsWith("Only Owner or Admin can")) return 403;
  return 500;
}

export async function POST(request: NextRequest) {
  try {
    const actingUser = getCurrentUser(request);
    // companyId is always resolved server-side from the acting user, never
    // trusted from the request body.
    const body = (await request.json()) as Omit<CreateStoreDto, "companyId">;

    const res = await createStore(body, actingUser);

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
    console.error("POST /api/stores error:", err);
    return NextResponse.json(
      {
        success: false,
        message: err?.message || "Store add failed!",
        error: err?.message || String(err),
      },
      { status: errorStatus(err) },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const actingUser = getCurrentUser(request);
    const res = await getStore({ actingUser });

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
