import { logIn } from "@/controllers/AuthController";
import { UserAuthInterface } from "@/types/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const data = (await req.json()) as UserAuthInterface;
    if (!data.username || !data.password) {
      return NextResponse.json(
        { success: false, message: "Username and password are required." },
        { status: 400 }
      );
    }
    const result = await logIn(data);

    if (!result) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    const { user, accessToken, refreshToken, store } = result;

    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      user,
      store,
    });
    response.cookies.set({
      name: "avdc_accessToken",
      value: accessToken,
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, 
    });

    response.cookies.set({
      name: "avdc_refreshToken",
      value: refreshToken,
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, message: "Internal server error", error: err },
      { status: 500 }
    );
  }
}
