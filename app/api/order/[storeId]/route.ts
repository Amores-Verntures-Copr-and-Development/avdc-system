import {
  createOrderController,
  getOrderController,
} from "@/controllers/OrderController";
import { CreateOrderDto } from "@/dtos/orders.dto";
import { OrderStatus, Orders } from "@/types/orders";
import { AccessTokenPayload, verifyToken } from "@/utils/jwt";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { assertStoreAccess } from "@/lib/auth/assertStoreAccess";
import { NextRequest, NextResponse } from "next/server";

function errorStatus(err: any): number {
  if (err?.message === "Unauthorized") return 401;
  if (err?.message === "You do not have access to this store") return 403;
  return 500;
}

// Listing a store's orders is a staff/admin dashboard feature - unlike
// order CREATION below, which the external customer-facing storefront also
// calls (without a staff session) to let guests place orders.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> },
) {
  try {
    const slug = (await params).storeId;
    const storeId = Number(slug);

    if (!storeId) {
      throw new Error("No store found");
    }

    const actingUser = getCurrentUser(request);
    await assertStoreAccess(actingUser, storeId);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const limit = searchParams.get("limit") || "";
    const page = searchParams.get("page") || "";
    const status = searchParams.get("status") as OrderStatus | null;
    const limitNumber = Number(limit) || 100;
    const pageNumber = Number(page) || 1;

    const keyFields: Partial<Orders> = { storeId };
    if (status) {
      keyFields.orderStatus = status;
    }

    const res = await getOrderController({
      keyFields,
      search,
      limit: limitNumber,
      offset: limitNumber * (pageNumber - 1),
    });

    if (!res.success) {
      throw new Error(`${res.error}`);
    }

    return NextResponse.json(
      {
        success: true,
        message: res.message,
        data: res.data,
        count: res.count,
      },
      { status: 200 },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetched orders!",
        error: err?.message || String(err),
      },
      { status: errorStatus(err) },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> },
) {
  try {
    const slug = (await params).storeId;
    const storeId = Number(slug);

    if (!storeId) {
      throw new Error("No store found");
    }

    const body = (await request.json()) as CreateOrderDto;
    const data: CreateOrderDto = { ...body, storeId };

    let createdBy: number | null = null;
    const token = request.cookies.get("avdc_accessToken")?.value;
    if (token) {
      try {
        const decoded = verifyToken<AccessTokenPayload>(token);
        createdBy = decoded.userId;
      } catch {
        // invalid/expired token - order can still be created without attribution
      }
    }

    const res = await createOrderController(data, createdBy);

    if (!res.success) {
      throw new Error(`${res.error}`);
    }

    return NextResponse.json(
      {
        success: true,
        message: res.message,
        data: res.data,
      },
      { status: 201 },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err?.message || String(err),
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
