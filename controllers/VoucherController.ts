import { CreateVoucherDto, UpdateVoucherDto } from "@/dtos/voucher.dto";
import { createVoucher as createVoucherService } from "@/services/vouchers/create-voucher";
import {
  getVoucherByCode,
  getVoucherById,
  getVoucherRedemptions,
  getVouchers,
} from "@/services/vouchers/get-vouchers";
import { updateVoucher as updateVoucherService } from "@/services/vouchers/update-voucher";
import { voidVoucher as voidVoucherService } from "@/services/vouchers/void-voucher";
import { validateAndComputeVoucher } from "@/services/vouchers/validate-voucher";

export const createVoucher = async (data: CreateVoucherDto) => {
  try {
    const voucher = await createVoucherService(data);
    return {
      success: true,
      message: "Voucher created successfully!",
      data: voucher,
    };
  } catch (e: any) {
    return {
      success: false,
      message: e?.code === "ER_DUP_ENTRY" ? "Voucher code already exists!" : e?.message || "Failed to create voucher!",
      error: e,
    };
  }
};

export const listVouchers = async ({
  search,
  status,
  limit,
  offset,
}: {
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) => {
  try {
    const { data, count } = await getVouchers({ search, status, limit, offset });
    return {
      success: true,
      message: "Vouchers fetched successfully!",
      data,
      count,
    };
  } catch (e: any) {
    return {
      success: false,
      message: "Failed to fetch vouchers!",
      error: e,
    };
  }
};

export const getVoucher = async (voucherId: number) => {
  try {
    const voucher = await getVoucherById(voucherId);
    if (!voucher) {
      return { success: false, message: "Voucher not found" };
    }
    return {
      success: true,
      message: "Voucher fetched successfully!",
      data: voucher,
    };
  } catch (e: any) {
    return {
      success: false,
      message: "Failed to fetch voucher!",
      error: e,
    };
  }
};

export const listVoucherRedemptions = async (voucherId: number) => {
  try {
    const data = await getVoucherRedemptions(voucherId);
    return {
      success: true,
      message: "Voucher redemptions fetched successfully!",
      data,
    };
  } catch (e: any) {
    return {
      success: false,
      message: "Failed to fetch voucher redemptions!",
      error: e,
    };
  }
};

export const updateVoucher = async (
  voucherId: number,
  data: UpdateVoucherDto,
) => {
  try {
    const voucher = await updateVoucherService(voucherId, data);
    return {
      success: true,
      message: "Voucher updated successfully!",
      data: voucher,
    };
  } catch (e: any) {
    return {
      success: false,
      message: e?.message || "Failed to update voucher!",
      error: e,
    };
  }
};

export const voidVoucher = async (voucherId: number) => {
  try {
    const voucher = await voidVoucherService(voucherId);
    return {
      success: true,
      message: "Voucher voided successfully!",
      data: voucher,
    };
  } catch (e: any) {
    return {
      success: false,
      message: e?.message || "Failed to void voucher!",
      error: e,
    };
  }
};

export const validateVoucher = async ({
  voucherCode,
  storeId,
  remainingAmount,
}: {
  voucherCode: string;
  storeId: number;
  remainingAmount: number;
}) => {
  try {
    const result = await validateAndComputeVoucher({
      voucherCode,
      storeId,
      remainingAmount,
    });
    return {
      success: true,
      message: "Voucher is valid!",
      data: result,
    };
  } catch (e: any) {
    return {
      success: false,
      message: e?.message || "Failed to validate voucher!",
      error: e,
    };
  }
};
