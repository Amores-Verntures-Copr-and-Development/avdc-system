import { CreateOrderCompositeItemDro } from "@/dtos/purchase.dto";
import { createOrderCompositeItems } from "@/services/order-composite/create-order-composite";
import { getOrderCompositeServices } from "@/services/order-composite/get-order-composite";

export const createOrderCompositeController = async (
  data: CreateOrderCompositeItemDro[],
) => {
  try {
    const ids = await createOrderCompositeItems({ data });
    return {
      success: true,
      message: "Items added as composite successfully!",
      data: ids,
    };
  } catch (e) {
    console.log({ e });
    return {
      success: false,
      message: "Failed to add as composite!",
      error: "Failed to add as composite!",
    };
  }
};

export const getOrderCompositeByPOItemController = async (poItemId: number) => {
  try {
    const data = await getOrderCompositeServices.findOrderCompositeByPOId({
      poItemId,
    });
    return {
      success: true,
      message: " Fetch composite successfully!",
      data: data,
    };
  } catch (e) {
    console.log({ e });
    return {
      success: false,
      message: "Failed to fetch composite!",
      error: "Failed to fetch composite!",
    };
  }
};
