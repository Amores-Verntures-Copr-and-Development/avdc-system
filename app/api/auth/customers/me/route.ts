import { getCustomerMeController } from "@/controllers/CustomerController";
import { CustomerAccessTokenPayload, verifyToken } from "@/utils/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("avdc_customerAccessToken")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 },
      );
    }

    let decoded: CustomerAccessTokenPayload;
    try {
      decoded = verifyToken<CustomerAccessTokenPayload>(token);
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 401 },
      );
    }

    const res = await getCustomerMeController({
      cusAccId: decoded.cusAccId,
      customerId: decoded.customerId,
    });

    if (!res.success) {
      return NextResponse.json(
        { success: false, message: res.message },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: res.message,
        data: res.data,
      },
      { status: 200 },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch customer",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
