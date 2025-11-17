import { getRequest, updateRequest } from "@/controllers/RequestController";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const slug = (await params).storeId;

    const res = await getRequest({
      storeId: Number(slug),
      controller: "store",
    });
    if (!res.success) {
      console.log(res.error);
      throw new Error(res.message || "Failed to create request");
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
      { status: 500 }
    );
  }
}

export async function PUT(_request: Request) {
  try {
    const data = await _request.json();
    const { items, controller } = data;
    const res = await updateRequest(controller, items);

    if (!res.success) {
      console.log(res.message);
      throw new Error(`${res.error}`);
    }

    return NextResponse.json(
      {
        success: true,
        message: " res.message",
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.log("Err: ", err);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetched inventory!",
        error: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
