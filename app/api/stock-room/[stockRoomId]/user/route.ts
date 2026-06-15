import { StockRoomUserController } from "@/controllers/StockRoomController";
import { CreateStockRoomUserDTO } from "@/dtos/stockRoom.dto";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ stockRoomId: string }> },
) {
  try {
    const { stockRoomId } = await params;

    if (!stockRoomId) {
      throw new Error("No stock room ID found!");
    }
    const body = (await req.json()) as CreateStockRoomUserDTO[];
    const res = await StockRoomUserController.createBulk({ data: body });

    if (!res.success) {
      throw new Error("Failed to create stock room user!");
    }
    return NextResponse.json(
      {
        success: res.success,
        message: res.message,
        data: res.data,
      },
      {
        status: 201,
      },
    );
  } catch (e: any) {
    console.log(e);
    return NextResponse.json(
      {
        success: false,
        message: e.message,
      },
      {
        status: 400,
      },
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ stockRoomId: string }> },
) {
  try {
    const { stockRoomId } = await params;

    if (!stockRoomId) {
      throw new Error("No stock room ID found!");
    }
    const res = await StockRoomUserController.get({
      fields: { stockRoomId: Number(stockRoomId) },
    });

    if (!res.success) {
      throw new Error("Failed to fetch!");
    }

    return NextResponse.json(
      {
        success: res.success,
        data: res.data,
      },
      {
        status: 200,
      },
    );
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
      },
      {
        status: 400,
      },
    );
  }
}
