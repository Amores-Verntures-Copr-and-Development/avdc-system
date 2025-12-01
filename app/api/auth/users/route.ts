import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("avdc_accessToken")?.value;

  if (!token) {
    // No token → treat as unauthorized
    return NextResponse.json(
      { user: null, message: "No token provided" },
      { status: 200 }
    );
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY!) as {
      userId: number;
      userRole: string;
      userFullName: string;
      empPosition: number;
      storeId: number | null;
    };

    return NextResponse.json({
      user: {
        userId: decoded.userId,
        userFullName: decoded.userFullName,
        userRole: decoded.userRole,
        empPosition: decoded.empPosition,
        storeId: decoded.storeId,
      },
    });
  } catch {
    // Invalid or expired token
    return NextResponse.json(
      { user: null, message: "Invalid or expired token" },
      { status: 401 }
    );
  }
}
