import { CreateSalesRefundDto } from "@/dtos/sales-refund.dto";
import { CreateSaleDto } from "@/dtos/sales.dto";
import { UserAuth } from "@/hooks/useSession";
import { processCreateSaleRefund } from "@/services/sales-refund/process-create-sales-refund";
import {
  getDailyStoreSales,
  getSalesServices,
} from "@/services/sales/get-sales";
import { processCreateSales } from "@/services/sales/process-create-sales";
import { processApprovedSale } from "@/services/sales/process-approved-sale";
import { processRejectedSale } from "@/services/sales/process-rejected-sale";
import { getSalesItemServices } from "@/services/sales/sale-items/get-sale-items";
import { updateSalesBySalesId } from "@/services/sales/update-sales";
import { sendEmailSalesBasePaymentMethods } from "@/services/sales/send-email-sales";
import { Sales } from "@/types/sales";

export const createSale = async (data: CreateSaleDto) => {
  try {
    const res = await processCreateSales(data);
    return {
      success: true,
      message: "Order process successfully!",
      data: res,
    };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to process order!",
      error: e,
    };
  }
};

export const updateSalesController = async ({
  data,
}: {
  data: Partial<Sales>;
}) => {
  try {
    if (!data.salesId) {
      throw new Error("No sales ID found!");
    }
    const res = await updateSalesBySalesId({
      salesId: data.salesId,
      data: data,
    });
    return {
      success: true,
      message: "Sales updated successfully!",
      data: res ?? null,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to update sales!",
      error: e,
    };
  }
};

export const sendSalesReceiptEmailController = async ({
  salesId,
}: {
  salesId: number;
}) => {
  try {
    const result = await sendEmailSalesBasePaymentMethods({
      salesId,
      force: true,
    });

    if (!result.sent) {
      return {
        success: false,
        message: result.reason ?? "Failed to send receipt email!",
      };
    }

    return {
      success: true,
      message: "Receipt email sent!",
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to send receipt email!",
      error: e,
    };
  }
};

// Shared by approve/reject - restricted to owner/admin/accounting (mirrors
// canEditUser's gate in SelectedSalesPage.tsx), since those are the roles
// trusted to act on what staff/supervisor submitted for approval.
function canActOnPendingSale(actingUser: {
  userRole: string;
  empPosition?: string;
}) {
  return (
    ["owner", "superadmin"].includes(actingUser.userRole) ||
    (!!actingUser.empPosition &&
      ["admin", "accounting"].includes(actingUser.empPosition))
  );
}

// Approves a pending_approval sale, triggering the inventory/transaction/
// email steps process-create-sales.ts deferred.
export const approveSaleController = async ({
  salesId,
  actingUser,
}: {
  salesId: number;
  actingUser: {
    userId: number;
    userRole: string;
    empPosition?: string;
  };
}) => {
  try {
    if (!salesId) {
      throw new Error("No sales ID found!");
    }
    if (!canActOnPendingSale(actingUser)) {
      throw new Error("Only an owner, admin, or accounting can approve a sale");
    }

    const res = await processApprovedSale({
      salesId,
      approvedBy: actingUser.userId,
    });
    return {
      success: true,
      message: "Sale approved successfully!",
      data: res ?? null,
    };
  } catch (e: any) {
    return {
      success: false,
      message: e?.message ?? "Failed to approve sale!",
      error: e,
    };
  }
};

// Rejects a pending_approval sale - no inventory/transaction/email to undo
// since process-create-sales.ts never ran those for a pending sale.
export const rejectSaleController = async ({
  salesId,
  reason,
  actingUser,
}: {
  salesId: number;
  reason?: string;
  actingUser: {
    userId: number;
    userRole: string;
    empPosition?: string;
  };
}) => {
  try {
    if (!salesId) {
      throw new Error("No sales ID found!");
    }
    if (!canActOnPendingSale(actingUser)) {
      throw new Error("Only an owner, admin, or accounting can reject a sale");
    }

    const res = await processRejectedSale({
      salesId,
      rejectedBy: actingUser.userId,
      reason,
    });
    return {
      success: true,
      message: "Sale rejected successfully!",
      data: res ?? null,
    };
  } catch (e: any) {
    return {
      success: false,
      message: e?.message ?? "Failed to reject sale!",
      error: e,
    };
  }
};

export const refundSalesController = async ({
  data,
  decoded,
  password,
}: {
  data: CreateSalesRefundDto;
  password: string;
  decoded: {
    userId: number;
    userRole: string;
    userFullName: string;
    empPosition: string;
    storeId: number | null;
  };
}) => {
  try {
    if (!data.salesId) {
      throw new Error("No sales ID found!");
    }
    const res = await processCreateSaleRefund({
      data: data,
      decoded: decoded,
      password,
    });
    return {
      success: true,
      message: "Sales refunded successfully!",
      data: res ?? null,
    };
  } catch (e: any) {
    return {
      success: false,
      message: e.message,
      error: e,
    };
  }
};

export const getSalesCreators = async ({ storeId }: { storeId?: number } = {}) => {
  try {
    const data = await getSalesServices.getSalesCreators({ storeId });
    return {
      success: true,
      message: "Sales creators fetched successfully!",
      data,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to fetch sales creators!",
      error: e,
    };
  }
};

export const getSalesByStoreId = async ({
  storeId,
  search,
  includeSaleItems,
  customer,
  customerType,
  from,
  to,
  keyFields,
  offset,
  limit,
  method,
  noLimit,
  excludeStatus,
}: {
  storeId: number;
  search?: string;
  includeSaleItems?: boolean;
  customer?: boolean;
  customerType?: "customer" | "walk-in";
  from?: string;
  to?: string;
  keyFields?: Partial<Sales>;
  limit?: number;
  offset?: number;
  method?: string;
  noLimit?: boolean;
  excludeStatus?: string | string[];
}) => {
  try {
    const data = await getSalesServices.getSales({
      keyFields: { storeId: storeId, ...keyFields },
      search,
      includeSaleItems,
      customer,
      customerType,
      from,
      to,
      offset,
      limit,
      method,
      nolimit: noLimit,
      excludeStatus,
    });
    const count = await getSalesServices.getSalesCount({
      keyFields: { storeId: storeId, ...keyFields },
      search,
      customer,
      customerType,
      from,
      to,
      excludeStatus,
    });

    return {
      success: true,
      message: "Sales fetched successfully!",
      data: data ?? null,
      count: count[0].count,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to fetched sales!",
      error: e,
    };
  }
};

export const getSales = async ({
  keyFields = {},
  search,
  storeName,
  from,
  to,
  includeSaleItems,
  customer,
  customerType,
  limit,
  offset,
  customerId,
  storeId,
  method,
  nolimit,
}: {
  keyFields?: Partial<Sales>;
  search?: string;
  storeName?: string;
  from?: string;
  to?: string;
  includeSaleItems?: boolean;
  customer?: boolean;
  customerType?: "customer" | "walk-in";
  limit?: number;
  offset?: number;
  customerId?: number;
  storeId?: number;
  method?: string;
  nolimit?: boolean;
}) => {
  try {
    const data = await getSalesServices.getSales({
      keyFields,
      search,
      storeName,
      from,
      to,
      includeSaleItems,
      customer,
      customerType,
      offset,
      limit,
      customerId,
      storeId,
      method,
      nolimit,
    });
    const count = await getSalesServices.getSalesCount({
      keyFields,
      search,
      storeName,
      from,
      to,
      storeId,
      customerId,
      customerType,
      method,
    });

    return {
      success: true,
      message: "Sales fetched successfully!",
      data: data ?? null,
      count: count[0].count,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to fetched sales!",
      error: e,
    };
  }
};

export const getSaleDashBoard = async () => {
  try {
    const data = await getDailyStoreSales();
    return {
      success: true,
      message: "Dail sales fetched successfully!",
      data: data ?? null,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to fetched daily sales!",
      error: e,
    };
  }
};
export const getSalesItemBySalesId = async (salesId: number) => {
  try {
    const data = await getSalesItemServices.findSaleItemsBySalesId({ salesId });
    return {
      success: true,
      message: "Sales Items fetched",
      data: data ?? null,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to fetched Sales Items!",
      error: e,
    };
  }
};

export const getTotalSalesDetails = async ({
  storeId,
  search,
  customer,
  customerType,
  from,
  to,
  store,
}: {
  storeId?: number;
  search?: string;
  customer?: boolean;
  customerType?: "customer" | "walk-in";
  from?: string;
  to?: string;
  store?: string;
}) => {
  try {
    const data = await getSalesServices.findSalesTotalsByStoreId({
      storeId,
      from,
      to,
      store,
      customerType,
    });
    return {
      success: true,
      message: "Sales Items fetched",
      data: data ?? null,
    };
  } catch (e) {
    console.log({ e });
    return {
      success: false,
      message: "Failed to fetched Sales Items!",
      error: e,
    };
  }
};

export const getSalesByProductVariant = async ({
  storeId,
  storeName,
  search,
  from,
  to,
  limit,
  offset,
}: {
  storeId?: number;
  storeName?: string;
  search?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}) => {
  try {
    const data = await getSalesServices.getSalesByProductVariant({
      storeId,
      storeName,
      search,
      from,
      to,
      limit,
      offset,
    });
    const count = await getSalesServices.getSalesByProductVariantCount({
      storeId,
      storeName,
      search,
      from,
      to,
    });

    return {
      success: true,
      message: "Sales by product variant fetched successfully!",
      data: data ?? null,
      count: count[0]?.count ?? 0,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to fetch sales by product variant!",
      error: e,
    };
  }
};

export const getSalesTransactionsByProductVariant = async ({
  prodVarId,
  storeId,
  storeName,
  from,
  to,
  limit,
  offset,
}: {
  prodVarId: number;
  storeId?: number;
  storeName?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}) => {
  try {
    const data = await getSalesServices.getSalesTransactionsByProductVariant({
      prodVarId,
      storeId,
      storeName,
      from,
      to,
      limit,
      offset,
    });
    const count =
      await getSalesServices.getSalesTransactionsByProductVariantCount({
        prodVarId,
        storeId,
        storeName,
        from,
        to,
      });

    return {
      success: true,
      message: "Sales transactions for product variant fetched successfully!",
      data: data ?? null,
      count: count[0]?.count ?? 0,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to fetch sales transactions for product variant!",
      error: e,
    };
  }
};
