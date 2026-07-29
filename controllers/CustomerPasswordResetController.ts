import {
  RequestPasswordResetDto,
  ResetPasswordDto,
  VerifyPasswordResetDto,
} from "@/dtos/customer.dto";
import { CustomerPasswordResetServices } from "@/services/customer/customerPasswordResetServices";

const GENERIC_REQUEST_MESSAGE =
  "If that email is registered, we've sent a password reset code to it.";

export const requestPasswordResetController = async (
  data: RequestPasswordResetDto,
) => {
  try {
    await CustomerPasswordResetServices.request(data);
  } catch (e) {
    // Swallowed on purpose — the response is identical whether or not the
    // account exists, or the send failed. Real outages surface in logs.
    console.error("Password reset request error:", e);
  }

  return {
    success: true,
    message: GENERIC_REQUEST_MESSAGE,
  };
};

export const verifyPasswordResetController = async (
  data: VerifyPasswordResetDto,
) => {
  try {
    const res = await CustomerPasswordResetServices.verify(data);
    return {
      success: true,
      message: "Code verified.",
      data: res,
    };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Invalid or expired code.",
      error: e,
    };
  }
};

export const resetPasswordController = async (data: ResetPasswordDto) => {
  try {
    const res = await CustomerPasswordResetServices.reset(data);
    return {
      success: true,
      message: "Password reset successfully!",
      data: res,
    };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to reset password!",
      error: e,
    };
  }
};
