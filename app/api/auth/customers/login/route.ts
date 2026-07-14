import { loginCustomerController } from "@/controllers/CustomerController";
import { CustomerLoginDto } from "@/dtos/customer.dto";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const data = (await request.json()) as CustomerLoginDto;

    if (!data.email || !data.password || !data.storeId) {
      return NextResponse.json(
        {
          success: false,
          message: "Email, password, and storeId are required.",
        },
        { status: 400 },
      );
    }

    const res = await loginCustomerController(data);
    if (!res.success || !res.data) {
      return NextResponse.json(
        {
          success: false,
          message: res.message,
        },
        { status: 401 },
      );
    }

    const { accessToken, refreshToken } = res.data;

    const response = NextResponse.json({
      success: true,
      message: res.message,
      data: { accessToken, refreshToken },
    });

    // response.cookies.set({
    //   name: "avdc_customerAccessToken",
    //   value: accessToken,
    //   httpOnly: true,
    //   secure: false,
    //   sameSite: "lax",
    //   path: "/",
    //   maxAge: 60 * 60 * 24 * 30,
    // });

    // response.cookies.set({
    //   name: "avdc_customerRefreshToken",
    //   value: refreshToken,
    //   httpOnly: true,
    //   secure: false,
    //   sameSite: "lax",
    //   path: "/",
    //   maxAge: 60 * 60 * 24 * 30,
    // });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to login",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
