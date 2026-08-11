import { login } from "@/controllers/ExternalDashboardAccessController";
import { NextRequest, NextResponse } from "next/server";

// Deliberately not behind getCurrentUser()/cookie auth - this IS the entry
// point external callers (avdc-track) use before they have any avdc-system
// session. Accepts either a dashboard access token or username/password;
// either way the caller must already hold a valid, active credential to
// get anything back.
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      token?: string;
      userName?: string;
      password?: string;
    };

    if (!body?.token && !(body?.userName && body?.password)) {
      throw new Error("Provide either a token or a username and password");
    }

    const res = await login(body);

    if (!res.success) {
      return NextResponse.json(
        { success: false, message: res.message },
        { status: 401 },
      );
    }

    return NextResponse.json(
      { success: true, message: res.message, data: res.data },
      { status: 200 },
    );
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        message: e?.message,
        error: e?.message || String(e),
      },
      { status: 400 },
    );
  }
}
