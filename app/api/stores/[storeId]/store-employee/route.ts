import {
  addStoreEmployee,
  getStoreEmployeeByFields,
  getStoreEmployeeDetailsByFields,
} from "@/controllers/StoreControllers";
import { createStoreEmployees } from "@/services/store/store-employee/create-store-employee";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { assertStoreAccess } from "@/lib/auth/assertStoreAccess";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> },
) {
  try {
    const { storeId } = await params;

    const actingUser = getCurrentUser(_request);
    await assertStoreAccess(actingUser, Number(storeId));

    const res = await getStoreEmployeeDetailsByFields({
      keyFields: { storeId: Number(storeId) },
    });
    return NextResponse.json({
      success: true,
      message: res.message,
      data: res.data, // could sanitize before returning
    });
  } catch (e) {
    return NextResponse.json({
      success: false,
      message: "Failed to fetch store employee!",
      error: e,
    });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> },
) {
  try {
    const { storeId } = await params;

    const actingUser = getCurrentUser(request);
    await assertStoreAccess(actingUser, Number(storeId));

    const body = await request.json();
    const res = await getStoreEmployeeDetailsByFields({
      keyFields: {
        storeId: Number(storeId),
        empId: body.empId,
      },
    });

    if (res.data?.length && res.data?.length >= 1) {
      return NextResponse.json({
        success: false,
        message: "Employee already exists in this store!",
      });
    }

    const createRes = await addStoreEmployee([
      {
        empId: body.empId,
        storeId: Number(storeId),
        storeEmpCreatedBy: body.storeEmpCreatedBy,
      },
    ]);
    if (!createRes.success) {
      throw new Error(createRes.message || "Failed to add employee to store");
    }

    return NextResponse.json({
      success: true,
      message: "Employee can be added to store!",
    });
  } catch (e) {
    return NextResponse.json({
      success: false,
      message: "Failed to validate employee for store!",
      error: e,
    });
  }
}
