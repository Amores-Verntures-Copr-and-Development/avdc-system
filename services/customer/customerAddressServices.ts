import {
  CreateCustomerAddressDto,
  UpdateCustomerAddressDto,
} from "@/dtos/customerAddress.dto";
import {
  deleteCustomerAddress,
  insertCustomerAddress,
  selectCustomerAddressById,
  selectCustomerAddresses,
  updateCustomerAddress,
} from "@/models/customerAddressModels";

export const customerAddressServices = {
  getAddresses: async ({ customerId }: { customerId: number }) => {
    try {
      return await selectCustomerAddresses({ customerId });
    } catch (e) {
      throw e;
    }
  },

  addAddress: async (data: CreateCustomerAddressDto) => {
    try {
      await insertCustomerAddress({ data });
      return await selectCustomerAddresses({ customerId: data.customerId });
    } catch (e) {
      throw e;
    }
  },

  updateAddress: async ({
    customerId,
    addressId,
    data,
  }: {
    customerId: number;
    addressId: number;
    data: UpdateCustomerAddressDto;
  }) => {
    try {
      const existing = await selectCustomerAddressById({
        addressId,
        customerId,
      });
      if (!existing) {
        throw new Error("Address not found for this customer");
      }
      await updateCustomerAddress({ addressId, customerId, data });
      return await selectCustomerAddresses({ customerId });
    } catch (e) {
      throw e;
    }
  },

  deleteAddress: async ({
    customerId,
    addressId,
  }: {
    customerId: number;
    addressId: number;
  }) => {
    try {
      const existing = await selectCustomerAddressById({
        addressId,
        customerId,
      });
      if (!existing) {
        throw new Error("Address not found for this customer");
      }
      await deleteCustomerAddress({ addressId, customerId });
      return await selectCustomerAddresses({ customerId });
    } catch (e) {
      throw e;
    }
  },
};
