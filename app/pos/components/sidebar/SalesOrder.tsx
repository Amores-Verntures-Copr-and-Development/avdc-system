import LoaderComponent from "@/components/shared/LoaderComponent";
import { DisplaySalesDto } from "@/dtos/sales.dto";
import { UserAuth } from "@/hooks/useSession";
import { ApiResponse } from "@/types/api";
import { fetcher } from "@/utils/fetcher";
import React from "react";
import useSWR from "swr";

interface SalesOrderProps {
  storeId: number | null;
  user: UserAuth | null;
}

const SalesOrder = ({ storeId, user }: SalesOrderProps) => {
  // ✅ PH-safe local date
  const todaysDate = new Date().toLocaleDateString("en-CA");

  const { data: response, isLoading } = useSWR<ApiResponse<DisplaySalesDto[]>>(
    user && storeId
      ? `/api/sales/${storeId}?to=${todaysDate}&from=${todaysDate}&includeSaleItems=true`
      : null,
    fetcher,
    {
      refreshInterval: 5000, // auto refresh every 5s for live kitchen view
    },
  );

  if (isLoading) return <LoaderComponent />;

  const sales = response?.data ?? [];
  const totalOrders = sales.length;

  return (
    <div className="h-full flex flex-col gap-3 p-3 overflow-y-auto">
      {totalOrders > 0 ? (
        sales.map((sale, index) => {
          const orderNumber = totalOrders - index;

          return (
            <div
              key={sale.salesId}
              className="bg-white shadow-md rounded-xl p-4 border border-gray-200"
            >
              {/* HEADER */}
              <div className="flex justify-between items-center border-b pb-2 mb-2">
                <span className="text-sm 2xl:text-lg font-bold">
                  Order #{orderNumber}
                </span>
                <span className="text-xs 2xl:text-sm text-gray-500">
                  {sale.salesNo}
                </span>
              </div>

              {/* REMARKS */}
              {sale.salesRemarks && (
                <div className="mb-2 text-sm text-red-600 font-medium">
                  📝 {sale.salesRemarks}
                </div>
              )}

              {/* ITEMS */}
              <div className="flex flex-col gap-2">
                {sale.salesItems?.map((item, i) => (
                  <div
                    key={item.salesItemId}
                    className="flex justify-between items-center bg-gray-50 rounded-lg px-3 py-2"
                  >
                    <div className="flex gap-2 items-center">
                      <span className="text-xs 2xl:text-sm font-semibold">
                        {i + 1}.
                      </span>
                      <span className="font-medium text-sm 2xl:text-base">
                        {item.saleItemName}
                      </span>
                    </div>

                    <span className="text-xs 2xl:text-lg font-bold">
                      x{item.salesItemQuantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <span className="text-xl font-semibold">No sales recorded today</span>
          <span className="text-sm">Waiting for new orders...</span>
        </div>
      )}
    </div>
  );
};

export default SalesOrder;
