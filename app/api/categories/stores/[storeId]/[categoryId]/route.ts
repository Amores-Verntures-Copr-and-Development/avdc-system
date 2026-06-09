import { deleteCategory, editCategory } from "@/controllers/CategoryController";
import { CategoryInterface } from "@/types/categories";
import { NextResponse } from "next/server";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ storeId: string; categoryId: string }> },
) {
  try {
    const { storeId, categoryId } = await params;

    const body = (await _request.json()) as Partial<CategoryInterface>;
    const res = await editCategory({
      updates: [{ ...body, categoryId: Number(categoryId) }],
      keyFields: ["categoryId"],
    });

    if (!res.success) {
      // propagate the actual message if available
      console.log(res.message);
      throw new Error(`${res.message ?? "Failed to fetch category"}`);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Category updated successfully",
        data: null,
      },
      { status: 201 },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Category update failed!",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ storeId: string; categoryId: string }> },
) {
  try {
    const { storeId, categoryId } = await params;

    // Implement delete logic here, e.g., call a deleteCategory function
    const res = await deleteCategory({
      updates: [
        {
          categoryId: Number(categoryId),
          categoryDeletedAt: new Date()
            .toISOString()
            .slice(0, 19)
            .replace("T", " "),
        },
      ],
      keyFields: ["categoryId"],
    });

    if (!res.success) {
      console.log(res.message);
      throw new Error(`${res.message ?? "Failed to delete category"}`);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Category deleted successfully",
        data: null,
      },
      { status: 200 },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Category deletion failed!",
        error: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}
