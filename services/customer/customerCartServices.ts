import { CreateCustomerCartDto, UpdateCustomerCartDto } from "@/dtos/customerCart.dto";
import {
  deleteCustomerCartByCustomerId,
  deleteCustomerCartItem,
  insertCustomerCartItem,
  selectCustomerCart,
  selectCustomerCartItemById,
  updateCustomerCartItemQuantity,
} from "@/models/customerCartModels";

export const customerCartServices = {
  getCart: async ({ customerId }: { customerId: number }) => {
    try {
      return await selectCustomerCart({ customerId });
    } catch (e) {
      throw e;
    }
  },

  addItem: async (data: CreateCustomerCartDto) => {
    try {
      await insertCustomerCartItem({ data });
      return await selectCustomerCart({ customerId: data.customerId });
    } catch (e) {
      throw e;
    }
  },

  updateItem: async ({
    customerId,
    cartId,
    data,
  }: {
    customerId: number;
    cartId: number;
    data: UpdateCustomerCartDto;
  }) => {
    try {
      const existing = await selectCustomerCartItemById({
        cartId,
        customerId,
      });
      if (!existing) {
        throw new Error("Cart item not found for this customer");
      }
      await updateCustomerCartItemQuantity({
        cartId,
        customerId,
        cartQuantity: data.cartQuantity,
      });
      return await selectCustomerCart({ customerId });
    } catch (e) {
      throw e;
    }
  },

  deleteItem: async ({
    customerId,
    cartId,
  }: {
    customerId: number;
    cartId: number;
  }) => {
    try {
      const existing = await selectCustomerCartItemById({
        cartId,
        customerId,
      });
      if (!existing) {
        throw new Error("Cart item not found for this customer");
      }
      await deleteCustomerCartItem({ cartId, customerId });
      return await selectCustomerCart({ customerId });
    } catch (e) {
      throw e;
    }
  },

  clearCart: async ({ customerId }: { customerId: number }) => {
    try {
      await deleteCustomerCartByCustomerId({ customerId });
      return await selectCustomerCart({ customerId });
    } catch (e) {
      throw e;
    }
  },
};
