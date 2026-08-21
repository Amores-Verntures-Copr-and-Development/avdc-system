import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getDBConnection } from "@/lib/db";
import { RowDataPacket } from "mysql2/promise";
export async function GET() {
  const cookieStore = await cookies();

  try {
    const token = cookieStore.get("avdc_accessToken")?.value;

    if (!token) {
      // No token → treat as unauthorized
      return NextResponse.json(
        { user: null, message: "No token provided" },
        { status: 200 },
      );
    }
    const decoded = jwt.verify(token, process.env.SECRET_KEY!) as {
      userId: number;
      userRole: string;
      userFullName: string;
      empPosition: number;
      storeId: number | null;
      companyId: number | null;
    };

    // superadmin is platform-level (not scoped to a company) by design, so
    // this is always null for them - only owner/employee belong to one.
    let companyName: string | null = null;
    if (decoded.userRole !== "superadmin") {
      const pool = await getDBConnection();
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT c.companyName FROM Users u
         LEFT JOIN Companies c ON c.companyId = u.companyId
         WHERE u.userId = ?`,
        [decoded.userId],
      );
      companyName = rows[0]?.companyName ?? null;
    }

    return NextResponse.json({
      user: {
        userId: decoded.userId,
        userFullName: decoded.userFullName,
        userRole: decoded.userRole,
        empPosition: decoded.empPosition,
        storeId: decoded.storeId,
        companyId: decoded.companyId,
        companyName,
      },
    });
  } catch {
    // Invalid or expired token
    return NextResponse.json(
      { user: null, message: "Invalid or expired token" },
      { status: 401 },
    );
  }
}
