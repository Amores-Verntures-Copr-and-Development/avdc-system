import {
  CreateOrderDto,
  CreateOrderItemDto,
  UpdateOrderDto,
  UpdateOrderItemDto,
} from "@/dtos/orders.dto";
import { processCompleteOrder } from "@/services/order/complete-order";
import { processCreateOrder } from "@/services/order/create-order";
import { deleteOrder } from "@/services/order/delete-order";
import { getOrders } from "@/services/order/get-order";
import { updateOrderByFields } from "@/services/order/update-order";
import { createOrderItems } from "@/services/order/order-items/create-order-items";
import { deleteOrderItemById } from "@/services/order/order-items/delete-order-items";
import { getOrderItemsByOrderId } from "@/services/order/order-items/get-order-items";
import { updateOrderItemByFields } from "@/services/order/order-items/update-order-items";
import { Orders } from "@/types/orders";

export const createOrderController = async (data: CreateOrderDto) => {
  try {
    const res = await processCreateOrder(data);
    return {
      success: true,
      message: "Order created successfully!",
      data: res,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to create order!",
      error: e,
    };
  }
};

export const getOrderController = async ({
  keyFields = {},
  search,
  limit,
  offset,
}: {
  keyFields?: Partial<Orders>;
  search?: string;
  limit?: number;
  offset?: number;
}) => {
  try {
    const res = await getOrders({ keyFields, search, limit, offset });
    return {
      success: true,
      message: "Order fetched successfully!",
      data: res.data,
      count: res.total,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to fetch order!",
      error: e,
    };
  }
};

export const updateOrderController = async (data: UpdateOrderDto) => {
  try {
    const res = await updateOrderByFields({ data });
    return {
      success: true,
      message: "Order updated successfully!",
      data: res,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to update order!",
      error: e,
    };
  }
};

export const completeOrderController = async ({
  storeId,
  orderId,
  completedBy,
}: {
  storeId: number;
  orderId: number;
  completedBy: number;
}) => {
  try {
    const res = await processCompleteOrder({ storeId, orderId, completedBy });
    return {
      success: true,
      message: "Order completed and converted to a sale!",
      data: res,
    };
  } catch (e) {
    console.log({ e });
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to complete order!",
      error: e,
    };
  }
};

export const deleteOrderController = async (orderId: number) => {
  try {
    const res = await deleteOrder({ orderId });
    return {
      success: true,
      message: "Order deleted successfully!",
      data: res,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to delete order!",
      error: e,
    };
  }
};

export const OrderItemController = {
  create: async ({
    orderId,
    data,
  }: {
    orderId: number;
    data: CreateOrderItemDto[];
  }) => {
    try {
      const res = await createOrderItems({ orderId, data });
      return {
        success: true,
        message: "Order item(s) added successfully!",
        data: res,
      };
    } catch (e) {
      return {
        success: false,
        message: "Failed to add order item(s)!",
        error: e,
      };
    }
  },

  get: async (orderId: number) => {
    try {
      const data = await getOrderItemsByOrderId({ orderId });
      return {
        success: true,
        message: "Order items fetched successfully!",
        data,
      };
    } catch (e) {
      return {
        success: false,
        message: "Failed to fetch order items!",
        error: e,
      };
    }
  },

  update: async (data: UpdateOrderItemDto) => {
    try {
      const res = await updateOrderItemByFields({ data });
      return {
        success: true,
        message: "Order item updated successfully!",
        data: res,
      };
    } catch (e) {
      return {
        success: false,
        message: "Failed to update order item!",
        error: e,
      };
    }
  },

  delete: async (orderItemId: number) => {
    try {
      const res = await deleteOrderItemById({ orderItemId });
      return {
        success: true,
        message: "Order item removed successfully!",
        data: res,
      };
    } catch (e) {
      return {
        success: false,
        message: "Failed to remove order item!",
        error: e,
      };
    }
  },
};
