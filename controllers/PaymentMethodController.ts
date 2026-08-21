import {
  CreatePaymentMethodDto,
  UpdatePaymentMethodDto,
} from "@/dtos/paymentMethods.dto";
import { createPaymentMethodSevices } from "@/services/payment-method/create-payment-method";
import { getPaymentMethodServices } from "@/services/payment-method/get-payment-method";
import { updatePaymentMethodServices } from "@/services/payment-method/update-payment-method";

export const createPaymentMethod = async (data: CreatePaymentMethodDto) => {
  try {
    const res = await createPaymentMethodSevices.createPaymentMethod({ data });
    return {
      data: res,
      success: true,
      message: "Payment Method created successfully!",
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to create payment method!",
      error: e,
    };
  }
};

export const getUniquePaymentMethodNames = async () => {
  try {
    const data = await getPaymentMethodServices.findUniquePaymentMethodNames();
    return {
      data,
      success: true,
      message: "Payment Method names fetched successfully!",
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to fetch payment method names!",
      error: e,
    };
  }
};

export const getPaymentMethodByStore = async (
  id: number,
  isOnline?: boolean,
) => {
  try {
    const data = await getPaymentMethodServices.findPaymentMethodByStoreId({
      number: id,
      isOnline,
    });
    return {
      data: data,
      success: true,
      message: "Payment Method fetched successfully!",
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to fetch payment method!",
      error: e,
    };
  }
};

export const updatePaymentMethod = async (data: UpdatePaymentMethodDto) => {
  try {
    const res = await updatePaymentMethodServices.updatePaymentMethod({
      data,
    });
    return {
      data: res,
      success: true,
      message: "Payment Method updated successfully!",
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to update payment method!",
      error: e,
    };
  }
};
