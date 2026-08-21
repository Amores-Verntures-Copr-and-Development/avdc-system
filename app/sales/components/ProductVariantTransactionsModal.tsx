"use client";

import IconButton from "@/components/shared/IconButton";
import LoaderComponent from "@/components/shared/LoaderComponent";
import Modal from "@/components/shared/Modal";
import { ApiResponse } from "@/types/api";
import {
  SalesByProductVariant,
  SalesTransactionByProductVariant,
} from "@/types/sales";
import { fetcher } from "@/utils/fetcher";
import { formatDateToWords } from "@/utils/formatDateToWords";
import { formatPeso } from "@/utils/formatPeso";
import { ArrowLeft, ArrowRight, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import useSWR from "swr";
import SalesStatusBadge from "./SalesStatusBadge";

const LIMIT = 10;

interface ProductVariantTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  variant: SalesByProductVariant | null;
  storeId?: number | null;
  store?: string;
  from?: string;
  to?: string;
}

const ProductVariantTransactionsModal = ({
  isOpen,
  onClose,
  variant,
  storeId,
  store,
  from,
  to,
}: ProductVariantTransactionsModalProps) => {
  const router = useRouter();
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [variant?.prodVarId]);

  const apiUrl = variant
    ? (() => {
        const params = new URLSearchParams();
        if (storeId) params.append("storeId", String(storeId));
        if (!storeId && store) params.append("store", store);
        if (from) params.append("from", from);
        if (to) params.append("to", to);
        params.append("limit", String(LIMIT));
        params.append("page", String(page));
        return `/api/sales/by-product-variant/${variant.prodVarId}?${params.toString()}`;
      })()
    : null;

  const { data: response, isLoading } = useSWR<
    ApiResponse<SalesTransactionByProductVariant[]>
  >(isOpen && apiUrl ? apiUrl : null, fetcher);

  const rows = response?.data ?? [];
  const totalCount = response?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / LIMIT));

  return (
    <Modal
      title={variant ? `${variant.prodName} - ${variant.prodVarName}` : ""}
      subtitle="Transactions this total is made up of"
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
    >
      {variant && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-3 rounded-xl bg-gray-50 p-3">
            <div>
              <p className="text-[10px] text-gray-500">Qty Sold</p>
              <p className="text-sm font-bold text-gray-900">
                {variant.totalQtySold}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500">Total Sales</p>
              <p className="text-sm font-bold text-gray-900">
                {formatPeso(variant.totalSales)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500">Transactions</p>
              <p className="text-sm font-bold text-gray-900">
                {variant.totalTransactions}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-[10px] uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Sales No</th>
                  <th className="px-3 py-2">Customer</th>
                  <th className="px-3 py-2">Qty</th>
                  <th className="px-3 py-2">Subtotal</th>
                  <th className="px-3 py-2">Payment Method</th>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="p-6">
                      <LoaderComponent title="Fetching transactions" />
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="p-6 text-center text-gray-400"
                    >
                      No transactions found for this period.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, index) => {
                    const paymentLabel = row.paymentMethods?.length
                      ? row.paymentMethods
                          .map((pm) => pm.payMetName)
                          .join(", ")
                      : "-";

                    return (
                      <tr key={row.salesId} className="hover:bg-gray-50">
                        <td className="px-3 py-2">
                          {(page - 1) * LIMIT + index + 1}
                        </td>
                        <td className="px-3 py-2 font-semibold">
                          {row.salesNo}
                        </td>
                        <td className="px-3 py-2">
                          {row.customerName ?? "Walk-in"}
                        </td>
                        <td className="px-3 py-2">{row.quantity}</td>
                        <td className="px-3 py-2">
                          {formatPeso(row.subtotal)}
                        </td>
                        <td className="px-3 py-2">{paymentLabel}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {formatDateToWords(row.salesCreatedAt)}
                        </td>
                        <td className="px-3 py-2">
                          <SalesStatusBadge status={row.salesStatus} />
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex justify-center">
                            <IconButton
                              onClick={() => {
                                onClose();
                                router.push(`/sales/${row.salesId}`);
                              }}
                              label="View"
                              bg="gray"
                              icon={<Eye className="w-3.5 h-3.5" />}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              Showing{" "}
              <span className="font-semibold text-gray-800">
                {rows.length === 0 ? 0 : (page - 1) * LIMIT + 1}
              </span>
              {"–"}
              <span className="font-semibold text-gray-800">
                {Math.min(page * LIMIT, totalCount)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-gray-800">
                {totalCount}
              </span>{" "}
              transactions
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-transparent text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous page"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <span className="px-2 font-medium text-gray-700">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-transparent text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next page"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ProductVariantTransactionsModal;
