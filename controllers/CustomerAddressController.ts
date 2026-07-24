import {
  CreateCustomerAddressDto,
  UpdateCustomerAddressDto,
} from "@/dtos/customerAddress.dto";
import { customerAddressServices } from "@/services/customer/customerAddressServices";

export const getCustomerAddresses = async ({
  customerId,
}: {
  customerId: number;
}) => {
  try {
    const data = await customerAddressServices.getAddresses({ customerId });
    return {
      success: true,
      message: "Addresses fetched successfully!",
      data,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to fetch addresses!",
      error: e,
    };
  }
};

export const addCustomerAddress = async (data: CreateCustomerAddressDto) => {
  try {
    const result = await customerAddressServices.addAddress(data);
    return {
      success: true,
      message: "Address added successfully!",
      data: result,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to add address!",
      error: e,
    };
  }
};

export const updateCustomerAddressById = async ({
  customerId,
  addressId,
  data,
}: {
  customerId: number;
  addressId: number;
  data: UpdateCustomerAddressDto;
}) => {
  try {
    const result = await customerAddressServices.updateAddress({
      customerId,
      addressId,
      data,
    });
    return {
      success: true,
      message: "Address updated successfully!",
      data: result,
    };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to update address!",
      error: e,
    };
  }
};

export const deleteCustomerAddressById = async ({
  customerId,
  addressId,
}: {
  customerId: number;
  addressId: number;
}) => {
  try {
    const result = await customerAddressServices.deleteAddress({
      customerId,
      addressId,
    });
    return {
      success: true,
      message: "Address removed successfully!",
      data: result,
    };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to remove address!",
      error: e,
    };
  }
};
