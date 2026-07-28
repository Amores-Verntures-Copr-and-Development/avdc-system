import {
  getProductVariantController,
  getProductVariantForOnlineController,
} from "@/controllers/ProductController";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || "";
    const search = searchParams.get("search") || "";
    const unit = searchParams.get("unit") || "";
    const limit = searchParams.get("limit") || "";
    const page = searchParams.get("page") || "";
    const limitNumber = Number(limit) || 100;
    const pageNumber = Number(page) || 0;
    const data = await getProductVariantForOnlineController({
      storeId: 11,
      search,
      category,
      unit,
      limit: limitNumber,
      offset: pageNumber,
      keyFields: {
        isAvailableOnline: true,
      },
    });

    return NextResponse.json(
      {
        message: "Data fetched successfully!",
        data: data.data,
        count: data.total,
      },
      {
        status: 200,
      },
    );
  } catch (e) {
    return NextResponse.json(
      {
        message: "Error!",
      },
      {
        status: 500,
      },
    );
  }
}
