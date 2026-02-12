import { POAddToRequestItemForm } from "@/app/purchase-orders/components/_components/AddItemToRequestFromPOModal";
import { CreateRequestFormDto, CreateRequestItemDto } from "@/dtos/request.dto";
import {
  getRequestOrderFromStockRoomByPurchaserFields,
  getRequestOrders,
} from "@/services/request/get-request";
import { processCompleteRequest } from "@/services/request/process-complete-request";
import { processCreateRequest } from "@/services/request/process-create-request";
import { processDeliveredPO } from "@/services/request/process-deliver-request";
import { processReceivedRequest } from "@/services/request/process-received-request";
import { createRequestItem } from "@/services/request/request-items/create-request-items";
import { getRequestOrderItems } from "@/services/request/request-items/get-request-items";
import { processAddItemFromPOtoRequest } from "@/services/request/request-items/process-add-po-to-request";
import { updateRequestItems } from "@/services/request/request-items/update-request-items";
import {
  getRequestItems,
  getRequestItemsByIds,
  getRequestOrderByPONumber,
} from "@/services/requestServices";
import { Request, RequestItems } from "@/types/request";

export const postRequest = async (data: CreateRequestFormDto) => {
  try {
    await processCreateRequest(data);
    return {
      success: true,
      message: "Request created successfully",
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to create request",
      error: e,
    };
  }
};

export const getRequest = async ({
  storeId,
  userId,
  controller,
  from,
  to,
  search,
  store,
}: {
  storeId?: number;
  userId?: number;
  controller?: "stock-room" | "store" | null;
  from?: string;
  to?: string;
  search?: string;
  store?: string;
}) => {
  let data;
  try {
    if (controller === "stock-room" && userId) {
      data = await getRequestOrderFromStockRoomByPurchaserFields(userId);
    } else if (controller === "store") {
      data = await getRequestOrders({ storeId });
    } else {
      data = await getRequestOrders({ from, to, search, store });
    }
    return {
      success: true,
      message: "Request fetched successfully",
      data: data ?? null,
    };
  } catch (e) {
    console.log("E: ", e);
    return {
      success: false,
      message: "Failed to fetch request",
      error: e,
    };
  }
};

export const getItemRequest = async ({ requestId }: { requestId?: number }) => {
  try {
    const data = await getRequestOrderItems({ requestId });
    return {
      success: true,
      message: "Request fetched successfully",
      data: data ?? null,
    };
  } catch (e) {
    console.log("E: ", e);
    return {
      success: false,
      message: "Failed to fetch request",
      error: e,
    };
  }
};

export const getItemRequestByIds = async ({
  requestId,
}: {
  requestId?: number[];
}) => {
  try {
    const data = await getRequestItemsByIds({ requestId });
    return {
      success: true,
      message: "Request fetched successfully",
      data: data ?? null,
    };
  } catch (e) {
    console.log("E: ", e);
    return {
      success: false,
      message: "Failed to fetch request",
      error: e,
    };
  }
};

export const getRequestOrderItemsPO = async (poNumber: string) => {
  try {
    const data = await getRequestOrderByPONumber(poNumber);
    return {
      success: true,
      message: "Request fetched successfully",
      data: data ?? null,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to fetch request",
      error: e,
    };
  }
};

export const updateRequest = async (
  controller: string,
  requestOrder: Request[],
  controllerId?: number,
) => {
  try {
    let message: string = "";
    if (controller === "delivered" && controllerId) {
      await processDeliveredPO(requestOrder, controllerId);
      message = `Request Order deliver successfully!`;
    }
    if (controller === "received") {
      await processReceivedRequest(requestOrder[0]);
      message = "Request Order recieved successfully!";
    }
    if (controller === "completed") {
      await processCompleteRequest(requestOrder);
      message = "Request Order completed successfully!";
    }

    return {
      success: true,
      message: message,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to update request",
      error: e,
    };
  }
};

export const addRequestItem = async (data: CreateRequestItemDto[]) => {
  try {
    console.log("[addRequestItem]", { data });
    const res = await createRequestItem({ data });
    return {
      success: true,
      message: "Request item added successfully",
      result: res,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to add item in request",
      error: e,
    };
  }
};

export const addItemFromPOtoRequest = async (data: POAddToRequestItemForm) => {
  try {
    console.log("[addItemFromPOtoRequest]", { data });
    const res = await processAddItemFromPOtoRequest(data);
    return {
      success: true,
      message: "Items added to request successfully",
      // result: res,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to add items to request",
      error: e,
    };
  }
};

export const updateRequestItem = async (requestItem: RequestItems[]) => {
  try {
    const res = await updateRequestItems({
      updates: requestItem,
      keyFields: ["reqItemId"],
    });
    return {
      success: true,
      message: "Request Items updated successfully1",
      data: res,
    };
  } catch (e) {
    console.log({ e });
    return {
      success: false,
      message: "Failed to update request items!",
      error: e,
    };
  }
};
