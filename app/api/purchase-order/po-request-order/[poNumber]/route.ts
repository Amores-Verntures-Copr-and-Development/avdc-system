import {
  getRequestOrderItemsPO,
  updateRequest,
} from "@/controllers/RequestController";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ poNumber: string }> }
) {
  try {
    const slug = (await params).poNumber;

    const res = await getRequestOrderItemsPO(slug);

    if (!res.success) {
      // propagate the actual message if available
      console.log(res.message);
      throw new Error(`${res.error}`);
    }

    return NextResponse.json(
      {
        success: true,
        message: res.message,
        data: res.data, // could sanitize before returning
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

export async function PUT(
  _request: Request,
  { params }: { params: Promise<{ poId: string }> }
) {
  try {
    const slug = (await params).poId;
    const poId = Number(slug);
    const data = await _request.json();
    const { request, controller } = data;
    const res = await updateRequest(controller, request);

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
