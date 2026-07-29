import {
  getCustomerMeController,
  updateCustomerProfileController,
} from "@/controllers/CustomerController";
import { UpdateCustomerProfileDto } from "@/dtos/customer.dto";
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

export async function PUT(request: NextRequest) {
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

    const data = (await request.json()) as UpdateCustomerProfileDto;

    // cusAccId/customerId always come from the verified token, never the
    // request body — a customer can only ever update their own profile.
    const res = await updateCustomerProfileController({
      cusAccId: decoded.cusAccId,
      customerId: decoded.customerId,
      updateData: data,
    });

    if (!res.success) {
      return NextResponse.json(
        { success: false, message: res.message },
        { status: 400 },
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
        message: "Failed to update profile",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
