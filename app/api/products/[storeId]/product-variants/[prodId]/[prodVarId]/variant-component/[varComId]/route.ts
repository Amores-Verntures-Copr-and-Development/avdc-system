import {
  hardDeleteVariantComponentController,
  updateProductVariantController,
  updateVariantComponentController,
} from "@/controllers/ProductController";
import { VariantComponents } from "@/types/products";
import { NextResponse } from "next/server";

export async function PUT(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{
      storeId: string;
      prodVarId: string;
      prodId: string;
      varComId: string;
    }>;
  },
) {
  try {
    const slug = (await params).storeId;
    const storeId = Number(slug);
    const slug1 = (await params).prodVarId;
    const prodVarId = Number(slug1);
    if (!storeId) {
      throw new Error("No storeId found");
    }
    if (!prodVarId) {
      throw new Error("No prodVarId found");
    }
    const data = (await _request.json()) as Partial<VariantComponents>;
    console.log({ data });
    const res = await updateVariantComponentController([data]);

    if (!res.success) {
      console.log(res.message, res.error);
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
    return NextResponse.json(
      {
        success: false,
        message: "Failed to add product variants!",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{
      storeId: string;
      prodVarId: string;
      prodId: string;
      varComId: string;
    }>;
  },
) {
  try {
    const slug = (await params).storeId;
    const storeId = Number(slug);
    const slug1 = (await params).prodVarId;
    const prodVarId = Number(slug1);
    const slug2 = (await params).prodId;
    const prodId = Number(slug2);
    const slug3 = (await params).varComId;
    const varComId = Number(slug3);
    if (!storeId) {
      throw new Error("No storeId found");
    }
    if (!prodId) {
      throw new Error("No prodVarId found");
    }
    if (!prodVarId) {
      throw new Error("No prodVarId found");
    }
    if (!varComId) {
      throw new Error("No prodVarId found");
    }

    const res = await hardDeleteVariantComponentController([
      {
        varComId: varComId,
      },
    ]);

    if (!res.success) {
      console.log(res.message, res.error);
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
