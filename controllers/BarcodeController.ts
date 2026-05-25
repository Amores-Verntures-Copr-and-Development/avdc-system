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
    const res = await createBarcode({ data: data });

    return {
      success: true,
      message: "Product barcode created successfully!",
      data: res,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to create product barcode!",
    };
  }
};

export const getBarcodeController = async ({
  keyFields = {},
}: {
  keyFields?: Partial<Barcodes>;
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
