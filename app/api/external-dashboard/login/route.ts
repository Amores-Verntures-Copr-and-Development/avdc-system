import { logIn } from "@/controllers/AuthController";
import { signExternalDashboardSession } from "@/services/externalDashboardAccess/dashboard-session-jwt";
import { getExternalDashboardIdentity } from "@/services/externalDashboardAccess/get-dashboard-identity";
import { UserAuthInterface } from "@/types/auth";
import { NextRequest, NextResponse } from "next/server";

// Companion to /api/external-dashboard/auth (the provisioned-token flow):
// lets a user sign in with their normal avdc-system username/password
// instead, provided they already have an active ExternalDashboardAccess
// grant. Issues a short-lived JWT (see dashboard-session-jwt.ts) rather than
// avdc-system's own employee session (avdc_accessToken), since a leaked
// dashboard session shouldn't double as a real employee login.
export async function POST(request: NextRequest) {
  try {
    const data = (await request.json()) as UserAuthInterface;

    if (!data.username || !data.password) {
      return NextResponse.json(
        { success: false, message: "Username and password are required." },
        { status: 400 },
      );
    }

    const result = await logIn(data);

    if (!result) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 },
      );
    }

    const identity = await getExternalDashboardIdentity(result.user.userId);

    return NextResponse.json(
      {
        success: true,
        message: "Login successful",
        sessionToken: signExternalDashboardSession(identity.userId),
        data: identity,
      },
      { status: 200 },
    );
  } catch (e: any) {
    const isForbidden = e?.message === "No active external dashboard access";

    return NextResponse.json(
      { success: false, message: e?.message || "Failed to log in" },
      { status: isForbidden ? 403 : 500 },
    );
  }
}
