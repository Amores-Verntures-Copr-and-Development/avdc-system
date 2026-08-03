"use client";

import Table, { Column } from "@/components/shared/Table";
import { useDebounce } from "@/hooks/useDebounce";
import { UserAuth } from "@/hooks/useSession";
import { ApiResponse } from "@/types/api";
import { SalesByProductVariant } from "@/types/sales";
import { fetcher } from "@/utils/fetcher";
import { formatPeso } from "@/utils/formatPeso";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useMemo } from "react";
import useSWR from "swr";

interface SalesByProductVariantTabProps {
  storeId: number | null;
  user: UserAuth | null;
}

const SalesByProductVariantTab = ({
  storeId,
  user,
}: SalesByProductVariantTabProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const limit = Number(searchParams.get("limit")) || 100;
  const page = Number(searchParams.get("page")) || 1;

  const isStoreScoped =
    user?.empPosition === "supervisor" || user?.empPosition === "staff";

  const apiUrl = useMemo(() => {
    const search = searchParams.get("search") || "";
    const store = searchParams.get("store") || "";
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";

    const params = new URLSearchParams();
    if (isStoreScoped && storeId) params.append("storeId", String(storeId));
    if (!isStoreScoped && store) params.append("store", store);
    if (search) params.append("search", search);
    if (from) params.append("from", from);
    if (to) params.append("to", to);
    params.append("limit", String(limit));
    params.append("page", String(page));

    return `/api/sales/by-product-variant?${params.toString()}`;
  }, [storeId, isStoreScoped, searchParams, limit, page]);

  const debouncedApiUrl = useDebounce(apiUrl, 600);

  const { data: response, isLoading } = useSWR<
    ApiResponse<SalesByProductVariant[]>
  >(user ? debouncedApiUrl : null, fetcher);

  const handleDateRangeChange = useCallback(
    (rangeData: { from?: string; to?: string }) => {
      const { from, to } = rangeData;
      const url = new URL(window.location.href);

      if (from) {
        url.searchParams.set("from", from);
      } else {
        url.searchParams.delete("from");
      }

      if (to) {
        url.searchParams.set("to", to);
      } else {
        url.searchParams.delete("to");
      }

      router.push(url.toString());
    },
    [router],
  );

  const columns: Column<SalesByProductVariant>[] = [
    {
      key: "#",
      name: "#",
      selector: (_row, index) => (page - 1) * limit + index + 1,
    },
    { key: "prodName", name: "Product" },
    { key: "prodVarName", name: "Variant" },
    {
      key: "totalQtySold",
      name: "Qty Sold",
      selector: (row) => (
        <span className="font-semibold">{row.totalQtySold}</span>
      ),
    },
    {
      key: "totalSales",
      name: "Total Sales",
      selector: (row) => (
        <span className="font-semibold">{formatPeso(row.totalSales)}</span>
      ),
    },
    { key: "totalTransactions", name: "Transactions" },
  ];

  return (
    <Table
      onDateRangeChange={handleDateRangeChange}
      showDateRange
      loading={isLoading}
      searchUrl="/sales"
      isRounded={false}
      columns={columns}
      data={response?.data ?? []}
      maxHeight="h-full"
      totalCount={response?.count}
      showPagination
      Datalabel="No sales recorded for this period"
    />
  );
};

export default SalesByProductVariantTab;
