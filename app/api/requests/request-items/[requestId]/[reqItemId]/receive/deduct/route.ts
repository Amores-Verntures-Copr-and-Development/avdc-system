import { DeductReceiveDto } from "@/app/requisitions/components/DeductReceiveModal";
import { DeductionReceiveController } from "@/controllers/RequestController";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ requestId: string }>;
  },
) {
  try {
    const slug = (await params).requestId;
    const requestId = Number(slug);
    if (!requestId) {
      throw new Error("No requestId found!");
    }
    const data = (await request.json()) as DeductReceiveDto;

    const res = await DeductionReceiveController(data);
    if (!res.success) {
      console.log(res.error);
      throw new Error(res.message);
    }

    return NextResponse.json({
      success: true,
      message: res.message,
      data: res.data,
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
