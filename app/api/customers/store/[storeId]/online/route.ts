import { CreateCustomerAccountDto } from "@/dtos/customer.dto";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> },
) {
  try {
    const { storeId } = await params;

    if (!storeId) {
      return NextResponse.json(
        {
          message: "No store ID found!",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json(
      {
        message: "Successfully registered!",
      },
      {
        status: 201,
      },
    );
  } catch (e) {
    return NextResponse.json(
      {
        message: "Failed to add customer!",
      },
      {
        status: 500,
      },
    );
  }
}
