import { registerCustomerOnlineController } from "@/controllers/CustomerController";
import { RegisterCustomerAccountDto } from "@/dtos/customer.dto";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const data = (await request.json()) as RegisterCustomerAccountDto;

    const res = await registerCustomerOnlineController(data);
    if (!res.success) {
      throw new Error(res.message);
    }

    return NextResponse.json({
      success: true,
      message: `res.message`,
      data: `res.data`,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create request",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
