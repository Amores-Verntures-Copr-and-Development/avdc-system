import {
  CreateCustomerDto,
  RegisterCustomerAccountDto,
} from "@/dtos/customer.dto";
import { customerServices } from "@/services/customer/customerServices";
import { Customer } from "@/types/customer";
import { StoreInterface } from "@/types/stores";
import { error } from "console";

export const createCustomer = async (data: CreateCustomerDto[]) => {
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

export const registerCustomerOnlineController = async (
  data: RegisterCustomerAccountDto,
) => {
  try {
    return {
      success: true,
      message: "Customer registered successfully!",
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to register customer!",
      error: e,
    };
  }
};

export const createCustomerMultipleStore = async (
  data: CreateCustomerDto[],
  store: StoreInterface[],
) => {
  try {
    const result = await customerServices.createCustomerMultipleStore({
      data,
      stores: store,
    });
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
  search,
  limit,
  offset,
  type,
  store,
}: {
  keyFields?: Partial<Customer>;
  search?: string;
  type?: string;
  limit?: number;
  offset?: number;
  store?: string;
}) => {
  try {
    const data = await customerServices.findCustomerByFields({
      keyFields,
      type,
      search,
      limit,
      offset,
      store,
    });
    const count = await customerServices.countCustomerByStoreId({
      keyFields,
      type,
      search,
      store,
    });
    return {
      success: true,
      message: "Customer fetched successfully!",
      data: data,
      count: count.totalCustomer,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to fetched customer!",
      error: e,
    };
  }
};

export const updateCustomerController = async ({
  keyFields = ["customerId"],
  updateData,
}: {
  keyFields?: (keyof Customer)[];
  updateData: Partial<Customer>[];
}) => {
  try {
    const data = await customerServices.updateCustomerByFields({
      keyFields: keyFields,
      updateData,
    });
    return {
      success: true,
      message: "Customer updated successfully!",
      data: data,
    };
  } catch (e) {
    console.log({ e });
    return {
      success: false,
      message: "Failed to update customer!",
      error: e,
    };
  }
};
