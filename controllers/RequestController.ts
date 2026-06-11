import { POAddToRequestItemForm } from "@/app/purchase-orders/components/_components/AddItemToRequestFromPOModal";
import { AdditionalReceiveDto } from "@/app/requisitions/components/AdditionalReceiveModal";
import { CreateRequestFormDto, CreateRequestItemDto } from "@/dtos/request.dto";
import { deleteRequestById } from "@/services/request/delete-request";
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
import { notOrderedRequestItems } from "@/services/request/request-items/not-ordered-requestItems";
import { processAdditionalReceiveRequestItem } from "@/services/request/request-items/proccess-additional-receive-item";
import { processAddItemFromPOtoRequest } from "@/services/request/request-items/process-add-po-to-request";
import { receiveRequestItems } from "@/services/request/request-items/received-requset-Items";
import { updateRequestItems } from "@/services/request/request-items/update-request-items";
import { updateRequests } from "@/services/request/update-request";
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
  keyfields?: Partial<Request>;
}) => {
  let data;
  try {
    if (controller === "stock-room" && userId) {
      data = await getRequestOrderFromStockRoomByPurchaserFields(userId);
    } else if (controller === "store") {
      data = await getRequestOrders({
        storeId,
        keyfields: { requestDeletedAt: null },
      });
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

export const updateRequestById = async ({
  data,
  keyFields = ["requestId"], // default primary key
}: {
  data: Partial<Request>;
  keyFields?: (keyof Request)[]; // which fields define the WHERE condition
}) => {
  try {
    const res = await updateRequests({ updates: [data], keyFields });
    return {
      success: true,
      message: "Request Order updated successfully!",
      data: res,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to update request order!",
      error: e,
    };
  }
};

export const addRequestItem = async (data: CreateRequestItemDto[]) => {
  try {
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
    const res = await processAddItemFromPOtoRequest(data);
    return {
      success: true,
      message: "Items added to request successfully",
      result: res,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to add items to request",
      error: e,
    };
  }
};

export const updateRequestItem = async (
  requestItem: Partial<RequestItems>[],
) => {
  try {
    const res = await updateRequestItems({
      updates: requestItem,
      keyFields: ["reqItemId"],
    });
    return {
      success: true,
      message: "Request Items updated successfully!",
      data: res,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to update request items!",
      error: e,
    };
  }
};

export const updateRequestItemByStatus = async ({
  requestItems,
  controller,
}: {
  requestItems: Partial<RequestItems>[];
  controller: "received" | "not_ordered";
}) => {
  try {
    if (controller === "received") {
      const res = await receiveRequestItems({ requestItems });
      return {
        success: true,
        message: "Request Items received successfully!",
        data: res,
      };
    }
    if (controller === "not_ordered") {
      const res = await notOrderedRequestItems({ requestItems });
      return {
        success: true,
        message: "Request Items not ordered successfully!",
        data: res,
      };
    } else {
      return {
        success: false,
        message: "No controller found!",
        data: [],
      };
    }
  } catch (e) {
    return {
      success: false,
      message: "Failed to update request items!",
      error: e,
    };
  }
};

export const AdditionalReceiveController = async (
  data: AdditionalReceiveDto,
) => {
  try {
    const res = await processAdditionalReceiveRequestItem(data);
    return {
      success: true,
      message: "Additional items received successfully.",
      data: res,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to process additional receive!",
      error: e,
    };
  }
};

export const deleteRequestByIDController = async (requestId: number) => {
  try {
    const res = await deleteRequestById({ requestId: requestId });
    return {
      success: true,
      message: "Request deleted successfully!",
      data: res,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to delete request!",
      error: e,
    };
  }
};
