import {
  addStoreEmployee,
  getStoresByEmployeeByUserId,
} from "@/controllers/StoreControllers";
import { CreateStoreEmployeeDto } from "@/dtos/store.dto";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const slug = (await params).userId;
    const res = await getStoresByEmployeeByUserId(Number(slug));
    if (!res.success) {
      throw new Error("Failed fetched stock rooms!");
    }
    return NextResponse.json({
      success: true,
      message: res.message,
      data: res.data,
    });
  } catch (e) {
    console.log(e);
    return NextResponse.json({
      success: false,
      message: "Failed fetched stock rooms!",
      error: e,
    });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const data = (await request.json()) as CreateStoreEmployeeDto[];
    const slug = (await params).userId;
    if (!slug) {
      throw new Error("No id found!");
    }
    const res = await addStoreEmployee(data);
    if (!res.success) {
      throw new Error("Failed fetched stock rooms!");
    }
    return NextResponse.json({
      success: true,
      message: res.message,
      data: res.result,
    });
  } catch (e) {
    console.log(e);
    return NextResponse.json({
      success: false,
      message: "Failed fetched stock rooms!",
      error: e,
    });
  }
}
