import { getStore } from "@/controllers/StoreControllers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const slug = (await params).userId;
    console.log({ slug });
    const res = await getStore({ empKeyfields: { userId: Number(slug) } });
    if (!res.success) {
      console.log(res.error);
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
