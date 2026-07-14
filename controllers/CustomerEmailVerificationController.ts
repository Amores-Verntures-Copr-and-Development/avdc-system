import {
  ResendCustomerVerificationDto,
  VerifyCustomerEmailDto,
} from "@/dtos/customer.dto";
import { CusEmailVerificationServices } from "@/services/customer/customerEmailVerificationServices";

export const verifyCustomerEmailController = async (
  data: VerifyCustomerEmailDto,
) => {
  try {
    const res = await CusEmailVerificationServices.verify(data);
    return {
      success: true,
      message: "Email verified successfully!",
      data: res,
    };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to verify email!",
      error: e,
    };
  }
};

export const resendCustomerVerificationController = async (
  data: ResendCustomerVerificationDto,
) => {
  try {
    const res = await CusEmailVerificationServices.resend(data);
    return {
      success: true,
      message: "Verification code resent successfully!",
      data: res,
    };
  } catch (e) {
    return {
      success: false,
      message:
        e instanceof Error ? e.message : "Failed to resend verification code!",
      error: e,
    };
  }
};
