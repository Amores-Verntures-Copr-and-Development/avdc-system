import { postRequest, updateRequest } from "@/controllers/RequestController";
import { CreateRequestFormDto } from "@/dtos/request.dto";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const data = (await request.json()) as CreateRequestFormDto;

    const res = await postRequest(data);
    if (!res.success) {
      console.log(res.error);
      throw new Error(res.message || "Failed to create request");
    }
    return NextResponse.json(
      {
        success: true,
        message: res.message,
        data: res,
      },
      { status: 201 },
    );
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

export async function PUT(request: NextRequest) {
  try {
    const ro = await request.json();
    const { data, controller, userId } = ro;
    const res = await updateRequest(controller, data, userId);
    if (!res.success) {
      console.log(res.error);
      throw new Error(res.message || "Failed to Update Request");
    }
    return NextResponse.json(
      {
        success: true,
        message: res.message,
      },
      { status: 201 },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to Update Request",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
