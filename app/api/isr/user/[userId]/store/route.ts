import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    return NextResponse.json(
      {
        success: true,
        message: "Good",
        data: [],
      },
      { status: 200 },
    );
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        message: "Bad",
        error: e,
      },
      { status: 400 },
    );
  }
}
