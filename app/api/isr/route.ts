import { ISRController } from "@/controllers/ISRController";
import { CreateISRDto } from "@/dtos/isr.dto";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateISRDto;

    const res = await ISRController.createISR({ data: body });

    if (!res.success) {
      throw new Error("Failed to create ISR.");
    }

    return NextResponse.json(
      {
        message: "ISR created successfully",
        data: res.data,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      },
      { status: 400 },
    );
  }
}

export async function GET() {
  try {
    const res = await ISRController.getAllISRs();

    if (!res.success) {
      throw new Error("Failed to fetch ISRs.");
    }

    return NextResponse.json(
      {
        message: "ISRs fetched successfully",
        data: res.data,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      },
      { status: 400 },
    );
  }
}
