import { CreateCustomerDto } from "@/dtos/customer.dto";
import { customerServices } from "@/services/customer/customerServices";
import { Customer } from "@/types/customer";
import { error } from "console";

export const createCustomer = async (data: CreateCustomerDto) => {
  try {
    const result = await customerServices.createCustomer({ data });
    return {
      success: true,
      message: "Customer added successfully!",
      data: result,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to add customer!",
      error: e,
    };
  }
};
export const getCustomer = async ({
  keyFields = {},
}: {
  keyFields?: Partial<Customer>;
}) => {
  try {
    const data = await customerServices.findCustomerByFields({ keyFields });
    return {
      success: true,
      message: "Customer fetched successfully!",
      data: data,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to fetched customer!",
      error: e,
    };
  }
};
