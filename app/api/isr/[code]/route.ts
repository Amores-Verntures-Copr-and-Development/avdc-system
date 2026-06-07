import { ISRController } from "@/controllers/ISRController";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  try {
    const res = await ISRController.getISRByFields({ isrCode: code });

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
