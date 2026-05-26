import { CreateBarcodeDto } from "@/dtos/barcode.dto";
import { createBarcode } from "@/services/barcode/create-bardcode";

import { getBarcodeByFields } from "@/services/barcode/get-barcode";
import { Barcodes } from "@/types/barcode";

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
