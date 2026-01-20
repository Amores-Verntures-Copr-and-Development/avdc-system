import {
  addRequestItem,
  getItemRequest,
} from "@/controllers/RequestController";
import { CreateRequestItemDto } from "@/dtos/request.dto";

import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ requestId: string }>;
  },
) {
  try {
    const slug = (await params).requestId;
    const requsetId = Number(slug);

    const res = await getItemRequest({ requestId: requsetId });
    if (!res.success) {
      console.log(res.error);
      throw new Error(res.message || "Failed to fetch request item");
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
    const data = (await request.json()) as CreateRequestItemDto[];

    const res = await addRequestItem(data);
    if (!res.success) {
      console.log(res.error);
      throw new Error(res.message || "Failed to fetch request item");
    }

    return NextResponse.json({
      success: true,
      message: res.message,
      data: res.result,
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
