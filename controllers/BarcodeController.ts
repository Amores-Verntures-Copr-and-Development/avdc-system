import { CreateBarcodeDto } from "@/dtos/barcode.dto";
import { createBarcode } from "@/services/barcode/create-bardcode";
import { deleteBarcode } from "@/services/barcode/delete-barcode";

import { getBarcodeByFields } from "@/services/barcode/get-barcode";
import { Barcodes } from "@/types/barcode";
import { PoolConnection } from "mysql2/promise";

export const createBarcodeController = async ({
  data,
}: {
  data: CreateBarcodeDto[];
}) => {
  try {
    const res = await createBarcode({ data });

    return {
      success: true,
      message: "Product barcode created successfully!",
      data: res,
    };
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    if (errorMessage.includes("already has an inventory item")) {
      return {
        success: false,
        message: errorMessage,
      };
    }
    // Handle custom duplicate barcode error
    if (errorMessage.includes("The following barcodes already exist")) {
      return {
        success: false,
        message: errorMessage,
      };
    }

    // Handle SQL duplicate key error
    if (error?.code === "ER_DUP_ENTRY") {
      return {
        success: false,
        message: "Duplicate barcode already exists.",
      };
    }

    return {
      success: false,
      message: "Something went wrong.",
      error: errorMessage,
    };
  }
};

export const getBarcodeController = async ({
  keyFields = {},
}: {
  keyFields?: Partial<Record<keyof Barcodes, any>>;
}) => {
  try {
    const res = await getBarcodeByFields({ keyFields });

    return {
      success: true,
      message: "Product barcode retrieved successfully!",
      data: res,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to retrieve product barcode!",
    };
  }
};

export const deleteBarcodeByFields = async ({
  connection,
  updates,
  keyFields = ["barcodeId"],
}: // 👈 optional per-field mode
{
  connection?: PoolConnection;
  updates: Partial<Barcodes>[];
  keyFields?: (keyof Barcodes)[];
}) => {
  try {
    const res = await deleteBarcode({ keyFields, updates, connection });

    return {
      success: true,
      message: "Product barcode deleted successfully!",
      data: res,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to delete product barcode!",
    };
  }
};
