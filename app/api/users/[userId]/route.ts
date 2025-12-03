import { getUserInfo } from "@/controllers/UserControllers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const slug = (await params).userId;
    const res = await getUserInfo(Number(slug));
    if (!res.success) {
      throw new Error("Failed fetched user info!");
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
      message: "Failed fetched user info!",
      error: e,
    });
  }
}
