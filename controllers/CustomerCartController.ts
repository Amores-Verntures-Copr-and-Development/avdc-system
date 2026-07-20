import { CreateCustomerCartDto, UpdateCustomerCartDto } from "@/dtos/customerCart.dto";
import { customerCartServices } from "@/services/customer/customerCartServices";

export const getCustomerCart = async ({
  customerId,
}: {
  customerId: number;
}) => {
  try {
    const data = await customerCartServices.getCart({ customerId });
    return {
      success: true,
      message: "Cart fetched successfully!",
      data,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to fetch cart!",
      error: e,
    };
  }
};

export const addCustomerCartItem = async (data: CreateCustomerCartDto) => {
  try {
    const result = await customerCartServices.addItem(data);
    return {
      success: true,
      message: "Item added to cart!",
      data: result,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to add item to cart!",
      error: e,
    };
  }
};

export const updateCustomerCartItem = async ({
  customerId,
  cartId,
  data,
}: {
  customerId: number;
  cartId: number;
  data: UpdateCustomerCartDto;
}) => {
  try {
    const result = await customerCartServices.updateItem({
      customerId,
      cartId,
      data,
    });
    return {
      success: true,
      message: "Cart item updated!",
      data: result,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to update cart item!",
      error: e,
    };
  }
};

export const deleteCustomerCartItem = async ({
  customerId,
  cartId,
}: {
  customerId: number;
  cartId: number;
}) => {
  try {
    const result = await customerCartServices.deleteItem({
      customerId,
      cartId,
    });
    return {
      success: true,
      message: "Cart item removed!",
      data: result,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to remove cart item!",
      error: e,
    };
  }
};
