import {
  CreatePurchaseOrderFormDto,
  CreatePurchaseOrderItemDto,
  DeliverItemsToStore,
  UpdatePurchaseOrdersDto,
} from "@/dtos/purchase.dto";
import {
  findPurchaseOrderByUserId,
  findPurchaserOrderByPORequestFields,
} from "@/services/purchase/get-purchase-order";
import { processApprovedPO } from "@/services/purchase/process-approved-purchase";
import { processCompletePO } from "@/services/purchase/process-complete-purchase";
import { processCreatePO } from "@/services/purchase/process-create-po";
import { processDeliverItemToStore } from "@/services/purchase/process-deliver-po-store";
import { processReceivedPO } from "@/services/purchase/process-received-purchase";
import { processSendPO } from "@/services/purchase/process-sent-purchase";
import { findStoreItemsBySupplierAndPOIds } from "@/services/purchase/purchase-items/get-purchase-tems";
import { handleUpdatePurchaseItems } from "@/services/purchase/purchase-items/handle-update-purchaser-items";
import { processSentPOItems } from "@/services/purchase/purchase-items/process-sent-purchase-items";
import {
  findAllPurchaseOrder,
  findPOItemsById,
  findPOItemsSupplierById,
  // updatePurchaseOrderReceive,
  // updatePurchaseOrderSent,
} from "@/services/purchaseOrderServices";
import {
  PurchaseOrderItems,
  PurchaseOrderRequest,
  PurchaseOrders,
} from "@/types/purchaseOrders";

export const createPurchaseOrder = async (data: CreatePurchaseOrderFormDto) => {
  try {
    await processCreatePO(data);
    return {
      success: true,
      message: "Purchase order created successfully",
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to create purchase order",
      error: e,
    };
  }
};

export const getPurchaseOrder = async () => {
  try {
    const data = await findAllPurchaseOrder();
    return {
      success: true,
      message: "Purchase Order fetched successfully",
      data: data ?? null,
    };
  } catch (e) {
    console.log("E: ", e);
    return {
      success: false,
      message: "Failed to fetch Purchase Order",
      error: e,
    };
  }
};

export const getPurchaseOrderByUserId = async (userId: number) => {
  try {
    const data = await findPurchaseOrderByUserId(userId);
    return {
      success: true,
      message: "Purchase Order fetched successfully",
      data: data ?? null,
    };
  } catch (e) {
    console.log("E: ", e);
    return {
      success: false,
      message: "Failed to fetch Purchase Order",
      error: e,
    };
  }
};

export const getPurchaseOrderItemById = async (poId: number) => {
  try {
    const data = await findPOItemsById({ poId });
    return {
      success: true,
      message: "Purchase Order fetched successfully",
      data: data ?? null,
    };
  } catch (e) {
    console.log("E: ", e);
    return {
      success: false,
      message: "Failed to fetch Purchase Order",
      error: e,
    };
  }
};

export const updateApprovedPurchaseOrder = async (
  data: UpdatePurchaseOrdersDto
) => {
  try {
    await processApprovedPO(data);
    return {
      success: true,
      message: `Purchase Order ${data.poNumber} approved successfully!`,
    };
  } catch (e) {
    return {
      success: false,
      error: e,
    };
  }
};

export const getPOItemsSupplierById = async (poId: number) => {
  try {
    const data = await findPOItemsSupplierById(poId);
    return {
      success: true,
      message: "Purchase Order fetched successfully",
      data: data ?? null,
    };
  } catch (e) {
    console.log("E: ", e);
    return {
      success: false,
      message: "Failed to fetch Purchase Order",
      error: e,
    };
  }
};

export const getStorePOItemsSupplierById = async (
  poId: number,
  suppId: number
) => {
  try {
    const data = await findStoreItemsBySupplierAndPOIds({ poId, suppId });
    return {
      success: true,
      message: "Purchase Order fetched successfully",
      data: data ?? null,
    };
  } catch (e) {
    console.log("E: ", e);
    return {
      success: false,
      message: "Failed to fetch Purchase Order",
      error: e,
    };
  }
};

export const updatePurchaseOrder = async (
  controller: string,
  data: PurchaseOrders
) => {
  let message: string = "";
  try {
    console.log(data);
    if (!controller) {
      throw new Error("No controller found!");
    }
    if (controller === "approved") {
      await processApprovedPO(data);
      message = `Purchase Order ${data.poNumber} approved successfully!`;
    }
    if (controller === "sent") {
      await processSendPO(data);
      message = `Purchase Order ${data.poNumber} sent successfully!`;
    }
    if (controller === "received") {
      await processReceivedPO(data);
      message = `Purchase Order ${data.poNumber} items received successfully!`;
    }
    if (controller === "completed") {
      await processCompletePO(data);
      message = `Purchase Order ${data.poNumber} successfully completed!`;
    }
    return {
      success: true,
      message: message,
    };
  } catch (e) {
    console.error(e);
    return {
      success: false,
      error: e,
    };
  }
};

export const updatePurchaseOrderItem = async (
  controller: string,
  data: PurchaseOrderItems[]
) => {
  let message: string = "";
  try {
    if (!controller) {
      throw new Error("No controller found!");
    }
    if (controller === "sent") {
      await processSentPOItems(data);
      message = "Items sent successfully!";
    }
    return {
      success: true,
      message: message,
    };
  } catch (e) {
    console.error(e);
    return {
      success: false,
      error: e,
    };
  }
};

export const deliverItemToStore = async (data: DeliverItemsToStore) => {
  try {
    const result = await processDeliverItemToStore(data);
    return {
      success: true,
      message: "Supplier items is flagged as deliver to store",
      result: result,
    };
  } catch (e) {
    console.log(e);
    return {
      success: false,
      message: "Failed to process deliver",
      error: e,
    };
  }
};

export const getPOByPORFields = async ({
  keyfields,
}: {
  keyfields: Partial<PurchaseOrderRequest>;
}) => {
  try {
    const data = await findPurchaserOrderByPORequestFields({ keyfields });
    return {
      success: true,
      message: "Purchase Order fetched successfully",
      data: data ?? null,
    };
  } catch (e) {
    console.log("E: ", e);
    return {
      success: false,
      message: "Failed to fetch Purchase Order",
      error: e,
    };
  }
};

export const updatePurchaseOrderItemByPoId = async (
  data: CreatePurchaseOrderItemDto[]
) => {
  try {
    const result = await handleUpdatePurchaseItems(data);
    return {
      success: true,
      message: "Item added to Purchase Order",
      result: result,
    };
  } catch (e) {
    console.log(e);
    return {
      success: false,
      message: "Failed to add item",
      error: e,
    };
  }
};
