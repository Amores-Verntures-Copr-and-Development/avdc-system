import { POAddToRequestItemForm } from "@/app/purchase-orders/components/_components/AddItemToRequestFromPOModal";
import { getPOByPORFields } from "@/controllers/PurchaseOrderController";
import { addItemFromPOtoRequest } from "@/controllers/RequestController";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ requestId: string }> },
) {
  try {
    const slug = (await params).requestId;

    const res = await getPOByPORFields({
      keyfields: { requestId: Number(slug) },
    });

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> },
) {
  try {
    const addItemForm = (await request.json()) as POAddToRequestItemForm;

    const slug = (await params).requestId;
    const requestId = Number(slug);
    if (!requestId) {
      throw new Error("No requestId found!");
    }
    const res = await addItemFromPOtoRequest(addItemForm);
    if (!res.success) {
      console.log(res.error);
      throw new Error(res.message || "Failed to Add PO item");
    }
    return NextResponse.json(
      {
        success: true,
        message: "Successfully added items to request",
      },
      { status: 201 },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch PO",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
