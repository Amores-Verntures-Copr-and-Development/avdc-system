import {
  CreateInstallmentDto,
  UpdateInstallmentCheckDto,
} from "@/dtos/installment.dto";
import { processCreateInstallment } from "@/services/installments/create-installment";
import {
  findInstallmentById,
  getInstallmentCollectionTrendForStores,
  getInstallmentsCountForStores,
  getInstallmentStatusBreakdownForStores,
  getInstallmentSummary,
  getInstallmentSummaryForStores,
  getTopOutstandingCustomersForStores,
  getUpcomingChecksCountForStores,
  getUpcomingChecksForStores,
  listInstallments,
  listInstallmentsForStores,
} from "@/services/installments/get-installments";
import { processUpdateInstallmentCheck } from "@/services/installments/update-installment-check";
import { selectCountInstallments } from "@/models/installmentModel";

export const createInstallment = async (data: CreateInstallmentDto) => {
  try {
    const installment = await processCreateInstallment(data);
    return {
      success: true,
      message: "Installment plan created successfully!",
      data: installment,
    };
  } catch (e: any) {
    return {
      success: false,
      message: e?.message || "Failed to create installment plan!",
      error: e,
    };
  }
};

export const getInstallments = async ({
  storeId,
  search,
  limit,
  offset,
}: {
  storeId: number;
  search?: string;
  limit?: number;
  offset?: number;
}) => {
  try {
    const data = await listInstallments({ storeId, search, limit, offset });
    const count = await selectCountInstallments({ storeId, search });

    return {
      success: true,
      message: "Installments fetched successfully!",
      data,
      count,
    };
  } catch (e: any) {
    return {
      success: false,
      message: "Failed to fetch installments!",
      error: e,
    };
  }
};

export const getInstallmentsForStores = async ({
  storeIds,
  search,
  limit,
  offset,
}: {
  storeIds: number[];
  search?: string;
  limit?: number;
  offset?: number;
}) => {
  try {
    const data = await listInstallmentsForStores({
      storeIds,
      search,
      limit,
      offset,
    });
    const count = await getInstallmentsCountForStores({ storeIds, search });

    return {
      success: true,
      message: "Installments fetched successfully!",
      data,
      count,
    };
  } catch (e: any) {
    return {
      success: false,
      message: "Failed to fetch installments!",
      error: e,
    };
  }
};

export const getInstallment = async ({
  installmentId,
  storeId,
}: {
  installmentId: number;
  storeId: number;
}) => {
  try {
    const data = await findInstallmentById({ installmentId, storeId });
    if (!data) {
      return { success: false, message: "Installment plan not found" };
    }
    return {
      success: true,
      message: "Installment plan fetched successfully!",
      data,
    };
  } catch (e: any) {
    return {
      success: false,
      message: "Failed to fetch installment plan!",
      error: e,
    };
  }
};

export const getInstallmentsSummary = async ({
  storeId,
}: {
  storeId: number;
}) => {
  try {
    const data = await getInstallmentSummary({ storeId });
    return {
      success: true,
      message: "Installment summary fetched successfully!",
      data,
    };
  } catch (e: any) {
    return {
      success: false,
      message: "Failed to fetch installment summary!",
      error: e,
    };
  }
};

export const getInstallmentsSummaryForStores = async ({
  storeIds,
}: {
  storeIds: number[];
}) => {
  try {
    const data = await getInstallmentSummaryForStores({ storeIds });
    return {
      success: true,
      message: "Installment summary fetched successfully!",
      data,
    };
  } catch (e: any) {
    return {
      success: false,
      message: "Failed to fetch installment summary!",
      error: e,
    };
  }
};

export const getInstallmentCollectionTrend = async ({
  storeIds,
  months,
}: {
  storeIds: number[];
  months?: number;
}) => {
  try {
    const data = await getInstallmentCollectionTrendForStores({
      storeIds,
      months,
    });
    return {
      success: true,
      message: "Installment collection trend fetched successfully!",
      data,
    };
  } catch (e: any) {
    return {
      success: false,
      message: "Failed to fetch installment collection trend!",
      error: e,
    };
  }
};

export const getUpcomingChecks = async ({
  storeIds,
  limit,
  offset,
}: {
  storeIds: number[];
  limit?: number;
  offset?: number;
}) => {
  try {
    const data = await getUpcomingChecksForStores({ storeIds, limit, offset });
    const count = await getUpcomingChecksCountForStores({ storeIds });

    return {
      success: true,
      message: "Upcoming checks fetched successfully!",
      data,
      count,
    };
  } catch (e: any) {
    return {
      success: false,
      message: "Failed to fetch upcoming checks!",
      error: e,
    };
  }
};

export const getInstallmentStatusBreakdown = async ({
  storeIds,
}: {
  storeIds: number[];
}) => {
  try {
    const data = await getInstallmentStatusBreakdownForStores({ storeIds });
    return {
      success: true,
      message: "Installment status breakdown fetched successfully!",
      data,
    };
  } catch (e: any) {
    return {
      success: false,
      message: "Failed to fetch installment status breakdown!",
      error: e,
    };
  }
};

export const getTopOutstandingCustomers = async ({
  storeIds,
  limit,
}: {
  storeIds: number[];
  limit?: number;
}) => {
  try {
    const data = await getTopOutstandingCustomersForStores({
      storeIds,
      limit,
    });
    return {
      success: true,
      message: "Top outstanding customers fetched successfully!",
      data,
    };
  } catch (e: any) {
    return {
      success: false,
      message: "Failed to fetch top outstanding customers!",
      error: e,
    };
  }
};

export const updateInstallmentCheckController = async ({
  installmentCheckId,
  storeId,
  data,
}: {
  installmentCheckId: number;
  storeId: number;
  data: UpdateInstallmentCheckDto;
}) => {
  try {
    const installmentId = await processUpdateInstallmentCheck({
      installmentCheckId,
      storeId,
      data,
    });
    const updated = await findInstallmentById({ installmentId, storeId });

    return {
      success: true,
      message: "Installment check updated successfully!",
      data: updated,
    };
  } catch (e: any) {
    return {
      success: false,
      message: e?.message || "Failed to update installment check!",
      error: e,
    };
  }
};
