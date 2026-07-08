import {
  getRequestOrderItemsPO,
  updateRequest,
} from "@/controllers/RequestController";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ poNumber: string }> },
) {
  try {
    const slug = (await params).poNumber;

    const res = await getRequestOrderItemsPO(slug);

    if (!res.success) {
      // propagate the actual message if available

      throw new Error(`${res.error}`);
    }

    return NextResponse.json(
      {
        success: true,
        message: res.message,
        data: res.data, // could sanitize before returning
      },
      { status: 201 },
    );
  } catch (err: any) {
    console.log("Err: ", err);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetched inventory!",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}

export async function PUT(_request: Request) {
  try {
    const data = await _request.json();
    const { request, controller, userId } = data;
    const res = await updateRequest(controller, request, userId);

    if (!res.success) {
      throw new Error(`${res.error}`);
    }

    return NextResponse.json(
      {
        success: true,
        message: " res.message",
      },
      { status: 201 },
    );
  } catch (err: any) {
    console.log("Err: ", err);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetched inventory!",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
