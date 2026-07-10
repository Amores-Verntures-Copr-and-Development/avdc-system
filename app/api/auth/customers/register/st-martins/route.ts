import { RegisterCustomerAccountDto } from "@/dtos/customer.dto";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const data = (await request.json()) as RegisterCustomerAccountDto;
    console.log({ data });
    // const res = await RegisterCustomerController(data, storeId);
    // if (!res.success) {
    //   console.log(res.error);
    //   throw new Error(res.message);
    // }

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
