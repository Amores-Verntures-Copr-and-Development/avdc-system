import { CreatePaymentMethodDto } from "@/dtos/paymentMethods.dto";
import { createPaymentMethodSevices } from "@/services/payment-method/create-payment-method";
import { getPaymentMethodServices } from "@/services/payment-method/get-payment-method";

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

export const getPaymentMethodByStore = async (id: number) => {
  try {
    const data = await getPaymentMethodServices.findPaymentMethodByStoreId({
      number: id,
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
