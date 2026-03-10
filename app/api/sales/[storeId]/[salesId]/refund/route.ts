import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import {
  refundSalesController,
  updateSalesController,
} from "@/controllers/SaleController";
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ storeId: string; salesId: string }> },
) {
  try {
    const slug = (await params).storeId;
    const storeId = Number(slug);
    const slug2 = (await params).salesId;
    const salesId = Number(slug2);
    const accessToken = _request.cookies.get("avdc_accessToken")?.value;
    if (!accessToken) {
      // No token → treat as unauthorized
      return NextResponse.json(
        { user: null, message: "No token provided" },
        { status: 200 },
      );
    }
    if (!storeId) {
      throw new Error("No store found");
    }
    if (!salesId) {
      throw new Error("No sales id found");
    }
    const req = await _request.json();
    const decoded = jwt.verify(accessToken, process.env.SECRET_KEY!) as {
      userId: number;
      userRole: string;
      userFullName: string;
      empPosition: string;
      storeId: number | null;
    };

    const { data, password } = req;

    const res = await refundSalesController({
      data: data,
      decoded: decoded,
      password: password,
    });
    if (!res.success) {
      throw new Error(res.message || "Failed to update sales");
    }
    return NextResponse.json(
      {
        success: true,
        message: res.message,
        data: res.data,
      },
      { status: 201 },
    );
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        message: e?.message,
        error: e?.message || String(e),
      },
      { status: 500 },
    );
  }
}
