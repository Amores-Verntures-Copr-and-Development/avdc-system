import { verifyExternalDashboardSession } from "@/services/externalDashboardAccess/dashboard-session-jwt";
import { getExternalDashboardIdentity } from "@/services/externalDashboardAccess/get-dashboard-identity";
import { NextRequest, NextResponse } from "next/server";

// Re-verifies a session issued by /api/external-dashboard/login. Re-checks
// the live grant (not just the JWT signature), so a revoke takes effect
// immediately instead of waiting out the 7-day expiry.
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { sessionToken?: string };

    if (!body?.sessionToken) {
      return NextResponse.json(
        { success: false, message: "No session token provided" },
        { status: 400 },
      );
    }

    const { userId } = verifyExternalDashboardSession(body.sessionToken);
    const identity = await getExternalDashboardIdentity(userId);

    return NextResponse.json(
      { success: true, message: "Session is valid", data: identity },
      { status: 200 },
    );
  } catch (e: any) {
    return NextResponse.json(
      { success: false, message: e?.message || "Invalid or expired session" },
      { status: 401 },
    );
  }
}
