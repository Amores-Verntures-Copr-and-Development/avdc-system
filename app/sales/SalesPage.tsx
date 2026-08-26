import IconButton from "@/components/shared/IconButton";
import PageHeader from "@/components/shared/PageHeader";
import PageLayout from "@/components/shared/PageLayout";
import Table, { Column } from "@/components/shared/Table";
import { DisplaySalesDto } from "@/dtos/sales.dto";
import { UserAuth } from "@/hooks/useSession";
import { ApiResponse } from "@/types/api";
import { fetcher } from "@/utils/fetcher";
import { formatDateToWords } from "@/utils/formatDateToWords";
import { formatPeso } from "@/utils/formatPeso";
import {
  Calendar,
  CalendarCheck,
  Download,
  Eye,
  FileText,
  PhilippinePeso,
  Plus,
  Store,
  Users,
} from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";
import useSWR from "swr";
import StatCard from "@/components/shared/StatCard";

import Button from "@/components/shared/Button";
import Modal from "@/components/shared/Modal";
import { useSearchParams, useRouter } from "next/navigation";
import DynamicDropdown, {
  DropdownOption,
} from "@/components/shared/DynamicDropdown";
import { useStores } from "@/hooks/userStore";
import { useDebounce } from "@/hooks/useDebounce";

import SalesReportModal from "./components/SalesReportModal";
import SalesByProductVariantTab from "./components/SalesByProductVariantTab";
import CreateSalesModal from "./components/CreateSalesModal";
import { FilterConfig, FilterOption } from "@/components/shared/FilterDropDown";
import { PaymentMethods } from "@/types/payment-methods";
import SalesStatusBadge from "./components/SalesStatusBadge";
import { SalesStatus } from "@/types/sales";
import { getSalesStatusOption } from "@/utils/salesUtils";
import { PaymentBreakdown } from "./components/PaymentBreakdown";

interface SalesPageProps {
  storeId: number;
  user: UserAuth | null;
  hasStore: boolean;
  isAdmin: boolean;
}

const SalesPage = ({ storeId, user, hasStore, isAdmin }: SalesPageProps) => {
  const [salesView, setSalesView] = useState<"sales" | "by-variant">("sales");
  const [showSalesBreakdown, setShowSalesBreakdown] = useState<
    "totalSales" | "todaysSales" | null
  >(null);
  const [showBreakdown, setShowBreakdown] = useState(true);
  const url =
    user?.empPosition === "supervisor" || user?.empPosition === "staff"
      ? `/api/sales/${storeId}`
      : `/api/sales`;
  const searchParams = useSearchParams();
  const limit = searchParams.get("limit") || "";
  const page = searchParams.get("page") || "1";
  const limitNumber = Number(limit) || 100; // default limit
  const pageNumber = Number(page) || 1;

  const selectedStoreIdFromUrl = searchParams.get("store");
  const apiUrl = useMemo(() => {
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const category = searchParams.get("category") || "";
    const unit = searchParams.get("unit") || "";
    const limit = searchParams.get("limit") || "";
    const page = searchParams.get("page") || "1";
    const store = searchParams.get("store");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const method = searchParams.get("method");
    const customerType = searchParams.get("customerType");
    const params = new URLSearchParams();
    if (method) params.append("method", method);
    if (customerType) params.append("customerType", customerType);
    if (search) params.append("search", search);
    if (status) params.append("status", status);
    if (category) params.append("category", category);
    if (unit) params.append("unit", unit);
    if (limit) params.append("limit", limit);
    if (store) params.append("store", store);
    if (to) params.append("to", to);
    if (from) params.append("from", from);
    params.append("page", page);

    return `${url}?${params.toString()}`;
  }, [storeId, searchParams]); // default page
  const debounceApi = useDebounce(apiUrl, 600);
  const {
    data: response,
    mutate: mutateSales,
    isLoading,
  } = useSWR<ApiResponse<DisplaySalesDto[]>>(
    user ? debounceApi : null,
    fetcher,
  );
  const [openDiscountId, setOpenDiscountId] = useState<number | null>(null);
  const columns = useMemo<Column<DisplaySalesDto>[]>(() => {
    return [
      {
        key: "#",
        name: "#",
        selector: (_row, index) => (pageNumber - 1) * limitNumber + index + 1,
      },
      {
        key: "salesNo",
        name: "Sales No",
        selector: (row) => <span className="font-semibold">{row.salesNo}</span>,
      },
      {
        key: "customerName",
        name: "Customer",
        selector: (row) => (row.customerId ? row.customerName : `Walk-in`),
      },
      {
        key: "salesSubTotal ",
        name: "Subtotal",
        selector: (row) => (
          <span className="text-[11px] ">{formatPeso(row.salesSubTotal)}</span>
        ),
      },
      {
        key: "salesDiscount ",
        name: "Discount",
        selector: (row: DisplaySalesDto) => {
          const discount = row.salesDiscounts || [];
          const vouchers = row.vouchers || [];
          const hasDiscount = discount.length > 0;
          const hasVoucher = vouchers.length > 0;
          const totalVoucherAmount = vouchers.reduce(
            (sum, v) => sum + Number(v.salesVoucherAmount),
            0,
          );
          const totalDiscountAmount = discount.reduce(
            (sum, d) => sum + Number(d.discountAmount),
            0,
          );

          const label =
            hasVoucher && hasDiscount
              ? `Voucher(${formatPeso(totalVoucherAmount)}), Discount(${formatPeso(totalDiscountAmount)})`
              : hasVoucher
                ? `Voucher(${formatPeso(totalVoucherAmount)})`
                : discount.length > 1
                  ? `Discounts (${discount.length})`
                  : discount.length === 1
                    ? `${discount[0].discountName} (${formatPeso(
                        discount[0].discountAmount,
                      )})`
                    : "-";

          return (
            <div className="relative min-w-[70px]">
              <button
                type="button"
                onClick={() =>
                  setOpenDiscountId(
                    openDiscountId === row.salesId ? null : row.salesId,
                  )
                }
                className="
      w-full rounded-lg border border-gray-200
      bg-gray-50 px-2 py-1
      text-left text-[10px] text-gray-700
      xl:text-xs
    "
              >
                {label}
              </button>

              {(hasVoucher || hasDiscount) && openDiscountId === row.salesId && (
                <div
                  className="
          absolute left-0 top-full z-[9999] mt-1
          w-64 overflow-hidden rounded-xl
          border border-gray-100 bg-white
          shadow-xl
        "
                >
                  <div className="max-h-48 overflow-y-auto p-1">
                    {vouchers.map((v) => (
                      <div
                        key={v.salesVoucherId}
                        className="
                rounded-lg px-3 py-2
                transition hover:bg-gray-50
              "
                      >
                        <div className="text-xs font-semibold text-gray-700">
                          {v.voucherCode}
                        </div>

                        <div className="mt-1 flex justify-between">
                          <span className="text-[10px] text-gray-400">
                            {v.voucherName ?? "Voucher"}
                          </span>

                          <span className="text-[10px] font-semibold text-primary-1">
                            - {formatPeso(v.salesVoucherAmount)}
                          </span>
                        </div>
                      </div>
                    ))}
                    {discount.map((disc) => (
                      <div
                        key={disc.salesDiscountId}
                        className="
                rounded-lg px-3 py-2
                transition hover:bg-gray-50
              "
                      >
                        <div className="text-xs font-semibold text-gray-700">
                          {disc.discountName}
                        </div>

                        <div className="mt-1 flex justify-between">
                          <span className="text-[10px] text-gray-400">
                            {disc.discountType === "percent"
                              ? `${disc.discountValue}%`
                              : `₱${disc.discountValue.toFixed(2)}`}
                          </span>

                          <span className="text-[10px] font-semibold text-red-500">
                            - ₱{disc.discountAmount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        },
      },
      {
        key: "refund ",
        name: "Refund",
        selector: (row) => {
          const totalRefunds = row.salesRefunds?.reduce(
            (total, sr) => Number(total) + Number(sr.salesRefAmount),
            0,
          );

          return (
            <span
              className={`text-[11px] ${
                totalRefunds !== undefined && Number(totalRefunds) !== 0
                  ? `text-red-800`
                  : "text-gray-800"
              }`}
            >
              {totalRefunds !== undefined && Number(totalRefunds) !== 0
                ? formatPeso(totalRefunds)
                : "-"}
            </span>
          );
        },
      },
      {
        key: "salesTotalAmount",
        name: "Total Amount",
        selector: (row) => {
          const totalRefunds = Array.isArray(row.salesRefunds)
            ? row.salesRefunds.reduce(
                (total, sr) => total + Number(sr.salesRefAmount),
                0,
              )
            : 0;

          return (
            <span className="font-semibold">
              {formatPeso(Number(row.salesTotalAmount) - totalRefunds)}
            </span>
          );
        },
      },
      { key: "totalItem", name: "Total Item" },
      {
        key: "method",
        name: "Payment Method",
        selector: (row) => {
          const paymentMethod = row.paymentMethods || [];
          return (
            <div className="group relative min-w-[100px]">
              <select
                className="border border-gray-300 rounded px-1 py-0.5 xl:px-2 xl:py-1 w-full text-[10px] xl:text-xs bg-gray-50 appearance-none cursor-default"
                disabled
              >
                <option value="">
                  {/* {paymentMethod.filter((s) => s !== null).length > 0
                ? `No Payment Method (${
                    paymentMethod.filter((s) => s !== null).length
                  })`
                : "No Payment Method"} */}
                  {paymentMethod.length > 1
                    ? `Multiple Payments (${
                        paymentMethod.filter((s) => s !== null).length
                      })`
                    : paymentMethod.length === 1
                      ? `${paymentMethod[0].payMetName} (${formatPeso(
                          Number(paymentMethod[0].salesPaymentAmount) >
                            Number(row.salesTotalAmount)
                            ? row.salesTotalAmount
                            : paymentMethod[0].salesPaymentAmount,
                        )})`
                      : `No payment`}
                </option>
              </select>
              {paymentMethod.filter((s) => s !== null).length > 0 && (
                <div className="absolute hidden group-hover:block z-10 top-full left-0 right-0 bg-white border border-gray-300 rounded shadow-lg max-h-32 overflow-y-auto">
                  {paymentMethod
                    .filter((method) => method !== null)
                    .map((method, index) => (
                      <div
                        key={index}
                        className="px-2 py-1 text-[10px] xl:text-xs hover:bg-gray-100 cursor-default"
                      >
                        {`${method.payMetName} (${formatPeso(
                          Number(method.salesPaymentAmount) >
                            Number(row.salesTotalAmount)
                            ? row.salesTotalAmount
                            : method.salesPaymentAmount,
                        )})`}
                      </div>
                    ))}
                </div>
              )}
            </div>
          );
        },
      },
      { key: "salesCreatedByName", name: "Created By" },
      {
        key: "salesCreatedAt",
        name: "Date",
        selector: (row) => formatDateToWords(row.salesCreatedAt ?? ""),
      },
      {
        key: "salesStatus",
        name: "Status",
        selector: (row) => (
          <SalesStatusBadge status={row.salesStatus as SalesStatus} />
        ),
      },
      {
        key: "salesSource",
        name: "Source",
        selector: (row) => (
          <span
            className={`inline-flex items-center justify-center rounded-full px-2 py-1 text-[10px] font-semibold whitespace-nowrap ${
              row.salesSource === "order"
                ? "bg-purple-100 text-purple-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {row.salesSource === "order" ? "Order" : "POS"}
          </span>
        ),
      },
    ];
  }, [response?.data]);
  const adminColumns = useMemo<Column<DisplaySalesDto>[]>(
    () => [
      {
        key: "#",
        name: "#",
        selector: (_row, index) => (pageNumber - 1) * limitNumber + index + 1,
      },
      {
        key: "salesNo",
        name: "Sales No",
        selector: (row) => <span className="font-semibold">{row.salesNo}</span>,
      },
      {
        key: "customerName",
        name: "Customer",
        selector: (row) => (row.customerId ? row.customerName : `Walk-in`),
      },
      {
        key: "salesSubTotal ",
        name: "Subtotal",
        selector: (row) => (
          <span className="text-[11px] ">{formatPeso(row.salesSubTotal)}</span>
        ),
      },
      {
        key: "salesDiscount ",
        name: "Discount",
        selector: (row: DisplaySalesDto) => {
          const discount = (row.salesDiscounts || []).filter(
            (d): d is (typeof row.salesDiscounts)[0] => d !== null,
          );
          const vouchers = row.vouchers || [];
          const hasDiscount = discount.length > 0;
          const hasVoucher = vouchers.length > 0;
          const totalVoucherAmount = vouchers.reduce(
            (sum, v) => sum + Number(v.salesVoucherAmount),
            0,
          );
          const totalDiscountAmount = discount.reduce(
            (sum, d) => sum + Number(d.discountAmount),
            0,
          );

          const label =
            hasVoucher && hasDiscount
              ? `Voucher(${formatPeso(totalVoucherAmount)}), Discount(${formatPeso(totalDiscountAmount)})`
              : hasVoucher
                ? `Voucher(${formatPeso(totalVoucherAmount)})`
                : discount.length > 1
                  ? `Discounts (${discount.length})`
                  : discount.length === 1
                    ? `${discount[0].discountName} (${formatPeso(
                        discount[0].discountAmount,
                      )})`
                    : ``;

          return (
            <div className="group relative">
              <select
                className="border border-gray-300 rounded px-1 py-0.5 xl:px-2 xl:py-1 w-full text-[10px] xl:text-xs bg-gray-50 appearance-none cursor-default"
                disabled
              >
                <option value="">{label}</option>
              </select>
              {(hasVoucher || hasDiscount) && (
                <div className="absolute hidden group-hover:block z-10 top-full left-0 right-0 bg-white border border-gray-300 rounded shadow-lg max-h-40 overflow-y-auto">
                  {vouchers.map((v) => (
                    <div
                      key={v.salesVoucherId}
                      className="flex flex-col px-2 py-1 rounded hover:bg-gray-100 transition-colors duration-150 text-[10px] xl:text-xs"
                    >
                      <div className="flex">
                        <span className=" text-xs font-semibold text-gray-700">
                          {v.voucherCode}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        {" "}
                        <span className="text-gray-400 text-[9px] xl:text-[10px]">
                          {v.voucherName ?? "Voucher"}
                        </span>
                        <span className="text-[10px] font-semibold text-primary-1">
                          - {formatPeso(v.salesVoucherAmount)}
                        </span>
                      </div>
                    </div>
                  ))}
                  {discount.map((disc) => (
                    <div
                      key={disc.salesDiscountId}
                      className="flex flex-col px-2 py-1 rounded hover:bg-gray-100 transition-colors duration-150 text-[10px] xl:text-xs"
                    >
                      <div className="flex">
                        <span className=" text-xs font-semibold text-gray-700">
                          {disc.discountName}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        {" "}
                        <span className="text-gray-400 text-[9px] xl:text-[10px]">
                          {disc.discountType === "percent"
                            ? `${disc.discountValue}%`
                            : `₱${disc.discountValue.toFixed(2)}`}
                        </span>
                        <span className="text-[10px] font-semibold text-red-600">
                          - ₱{disc.discountAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        },
      },
      {
        key: "refund ",
        name: "Refund",
        selector: (row) => {
          const totalRefunds = row.salesRefunds?.reduce(
            (total, sr) => Number(total) + Number(sr.salesRefAmount),
            0,
          );

          return (
            <span
              className={`text-[11px] ${
                totalRefunds !== undefined && Number(totalRefunds) !== 0
                  ? `text-red-800`
                  : "text-gray-800"
              }`}
            >
              {totalRefunds !== undefined && Number(totalRefunds) !== 0
                ? formatPeso(totalRefunds)
                : "-"}
            </span>
          );
        },
      },
      {
        key: "salesTotalAmount",
        name: "Total Amount",
        selector: (row) => {
          const totalRefunds = Array.isArray(row.salesRefunds)
            ? row.salesRefunds.reduce(
                (total, sr) => total + Number(sr.salesRefAmount),
                0,
              )
            : 0;

          return (
            <span className="font-semibold">
              {formatPeso(Number(row.salesTotalAmount) - totalRefunds)}
            </span>
          );
        },
      },
      { key: "totalItem", name: "Total Item" },
      {
        key: "method",
        name: "Payment Method",
        selector: (row: DisplaySalesDto) => {
          const paymentMethod = row.paymentMethods || [];
          return (
            <div className="group relative">
              <select
                className="border border-gray-300 rounded px-1 py-0.5 xl:px-2 xl:py-1 w-full text-[10px] xl:text-xs bg-gray-50 appearance-none cursor-default"
                disabled
              >
                <option value="">
                  {/* {paymentMethod.filter((s) => s !== null).length > 0
                ? `No Payment Method (${
                    paymentMethod.filter((s) => s !== null).length
                  })`
                : "No Payment Method"} */}
                  {paymentMethod.length > 1
                    ? `Multiple Payments (${
                        paymentMethod.filter((s) => s !== null).length
                      })`
                    : paymentMethod.length === 1
                      ? `${paymentMethod[0].payMetName} (${formatPeso(
                          Number(paymentMethod[0].salesPaymentAmount) >
                            Number(row.salesTotalAmount)
                            ? row.salesTotalAmount
                            : paymentMethod[0].salesPaymentAmount,
                        )})`
                      : `No payment`}
                </option>
              </select>
              {paymentMethod.filter((s) => s !== null).length > 0 && (
                <div className="absolute hidden group-hover:block z-10 top-full left-0 right-0 bg-white border border-gray-300 rounded shadow-lg max-h-32 overflow-y-auto">
                  {paymentMethod
                    .filter((method) => method !== null)
                    .map((method, index) => (
                      <div
                        key={index}
                        className="px-2 py-1 text-[10px] xl:text-xs hover:bg-gray-100 cursor-default"
                      >
                        {`${method.payMetName} (${formatPeso(
                          Number(method.salesPaymentAmount) >
                            Number(row.salesTotalAmount)
                            ? row.salesTotalAmount
                            : method.salesPaymentAmount,
                        )})`}
                      </div>
                    ))}
                </div>
              )}
            </div>
          );
        },
      },
      {
        key: "storeName",
        name: "Store",
        selector: (row) => (
          <span className="font-semibold">{row.storeName}</span>
        ),
      },
      { key: "salesCreatedByName", name: "Created By" },
      {
        key: "salesCreatedAt",
        name: "Date",
        selector: (row) => formatDateToWords(row.salesCreatedAt ?? ""),
      },
      {
        key: "salesStatus",
        name: "Status",
        selector: (row) => <SalesStatusBadge status={row.salesStatus} />,
      },
      {
        key: "salesSource",
        name: "Source",
        selector: (row) => (
          <span
            className={`inline-flex items-center justify-center rounded-full px-2 py-1 text-[10px] font-semibold whitespace-nowrap ${
              row.salesSource === "order"
                ? "bg-purple-100 text-purple-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {row.salesSource === "order" ? "Order" : "POS"}
          </span>
        ),
      },
    ],
    [response?.data],
  );
  const router = useRouter();
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [showCreateSales, setShowCreateSales] = useState(false);
  const [createSalesStoreId, setCreateSalesStoreId] = useState<number | null>(
    null,
  );
  const [showModal, setShowModal] = useState<"report" | "export" | null>(null);
  const [isReport, setIsReport] = useState<"Customer" | "Sales" | null>(null);
  const { stores } = useStores({
    user,
    hasStore,
    isAdmin,
  });

  const defaultStoreFromUrl = searchParams.get("store") || "";

  // selectedStoreId only gets set when the store dropdown's onChange fires -
  // on a fresh page load/refresh with ?store= already in the URL (e.g. a
  // link from another page, or just reloading), it's still null even though
  // a store IS effectively selected. Falling back to resolving the URL's
  // store name against the loaded store list keeps the Payment Method
  // filter (and anything else keyed off the store) from silently going
  // empty in that case.
  const filterStoreId =
    selectedStoreId ??
    (Array.isArray(stores)
      ? stores.find((s) => s.storeName === defaultStoreFromUrl)?.storeId
      : undefined) ??
    null;

  const hasStoreContext = hasStore || Boolean(filterStoreId);

  const { data: paymentMethodResponse = { data: [] } } = useSWR<{
    data: PaymentMethods[];
  }>(
    hasStore
      ? `/api/payment-method/store/${user?.storeId}/`
      : filterStoreId
        ? `/api/payment-method/store/${filterStoreId}/`
        : null,
    fetcher,
  );

  // No store is currently selected (admin browsing across every store) -
  // there's no single store's payment methods to show, so fall back to
  // the distinct names across all stores (same source the Customers page
  // filter uses) instead of leaving this filter empty.
  const { data: uniquePaymentMethodNamesRes } = useSWR<ApiResponse<string[]>>(
    !hasStoreContext ? "/api/payment-method/names" : null,
    fetcher,
  );

  const paymentMethodOptions: FilterOption[] = hasStoreContext
    ? paymentMethodResponse.data.map((p) => ({
        label: p.payMetName,
        value: String(p.payMetName),
      }))
    : (uniquePaymentMethodNamesRes?.data ?? []).map((name) => ({
        label: name,
        value: name,
      }));

  const canCreateSalesRole = !["staff", "supervisor", "purchaser"].includes(
    user?.empPosition ?? "",
  );
  const needsStoreSelection = !hasStore || isAdmin;
  const hasStoreSelected =
    !needsStoreSelection ||
    Boolean(selectedStoreId) ||
    Boolean(defaultStoreFromUrl);
  const canCreateSales = canCreateSalesRole && hasStoreSelected;

  const detailsUrl =
    user && storeId
      ? `/api/sales/${storeId}/details`
      : user
        ? `/api/sales/details/`
        : null;
  const apiDetailsUrl = useMemo(() => {
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const category = searchParams.get("category") || "";
    const unit = searchParams.get("unit") || "";
    const method = searchParams.get("method");
    const store = searchParams.get("store");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const customerType = searchParams.get("customerType");

    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (status) params.append("status", status);
    if (category) params.append("category", category);
    if (unit) params.append("unit", unit);
    if (method) params.append("method", method);
    if (store) params.append("store", store);
    if (customerType) params.append("customerType", customerType);
    if (to) params.append("to", to);
    if (from) params.append("from", from);

    return `${detailsUrl}?${params.toString()}`;
  }, [storeId, searchParams, user]);

  const debounceDetailsApi = useDebounce(apiDetailsUrl, 600);

  const { data: responseDetails } = useSWR(
    user ? debounceDetailsApi : null,
    fetcher,
  );

  // The Total Sales card has its own period selector (Today / This Week /
  // This Month / ...) as a fallback, but the table's date-range filter
  // (when the user has explicitly picked a range there) takes priority -
  // otherwise the card silently ignores the date the user just chose.
  const [salesPeriod, setSalesPeriod] = useState<
    "today" | "week" | "month" | "year" | "all"
  >("month");

  const salesPeriodRange = useMemo(() => {
    const pad = (n: number) => String(n).padStart(2, "0");
    const toDateStr = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const now = new Date();
    const today = toDateStr(now);

    switch (salesPeriod) {
      case "today":
        return { from: today, to: today };
      case "week": {
        const start = new Date(now);
        start.setDate(now.getDate() - now.getDay());
        return { from: toDateStr(start), to: today };
      }
      case "year": {
        const start = new Date(now.getFullYear(), 0, 1);
        return { from: toDateStr(start), to: today };
      }
      case "all":
        return { from: "", to: "" };
      case "month":
      default: {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return { from: toDateStr(start), to: today };
      }
    }
  }, [salesPeriod]);

  const tableDateFrom = searchParams.get("from") || "";
  const tableDateTo = searchParams.get("to") || "";
  const hasTableDateRange = Boolean(tableDateFrom && tableDateTo);

  const salesCardUrl = useMemo(() => {
    const store = searchParams.get("store");
    const range = hasTableDateRange
      ? { from: tableDateFrom, to: tableDateTo }
      : salesPeriodRange;
    const params = new URLSearchParams();
    if (store) params.append("store", store);
    if (range.from) params.append("from", range.from);
    if (range.to) params.append("to", range.to);

    return `${detailsUrl}?${params.toString()}`;
  }, [
    detailsUrl,
    searchParams,
    salesPeriodRange,
    hasTableDateRange,
    tableDateFrom,
    tableDateTo,
  ]);

  const debounceSalesCardApi = useDebounce(salesCardUrl, 300);

  const { data: salesCardResponse } = useSWR(
    user && detailsUrl ? debounceSalesCardApi : null,
    fetcher,
  );

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
  const details = responseDetails?.data[0];
  const totalCountSales = details?.totalCountSales ?? 0;
  const totalCustomer = details?.totalCustomer ?? 0;
  const todaySales = details?.todaySales ?? 0;
  const todaysSalesPaymentMethods = details?.todaysSalesPaymentMethods ?? [];
  const ordersTrend = details?.ordersTrend ?? [];
  const customersTrend = details?.customersTrend ?? [];
  const todaySalesTrend = details?.todaySalesTrend ?? [];
  const ordersGrowthPct = details?.ordersGrowthPct ?? 0;
  const customersGrowthPct = details?.customersGrowthPct ?? 0;

  const salesCardDetails = salesCardResponse?.data?.[0];
  const totalSales = salesCardDetails?.totalSales ?? 0;
  const totalSalesPaymentMethods =
    salesCardDetails?.totalSalesPaymentMethods ?? [];

  const storeOptions = Array.isArray(stores)
    ? stores.map((store) => ({
        label: store.storeName, // or whatever you want to show
        value: store.storeName, // optional leading icon if you have one
      }))
    : [];

  // const methodOptions

  const salesFilterConfig: FilterConfig[] = [
    {
      id: "method",
      label: "Payment Method",
      options:
        paymentMethodOptions.length > 0
          ? paymentMethodOptions
          : [{ label: "Select first a store", value: "" }],
    },
    {
      id: "customerType",
      label: "Customer Type",
      options: [
        { label: "Customer", value: "customer" },
        { label: "Walk-in", value: "walk-in" },
      ],
    },
    {
      id: "status",
      label: "Status",
      options: [
        { label: "Pending Approval", value: SalesStatus.PENDING_APPROVAL },
        { label: "Rejected", value: SalesStatus.REJECTED },
        { label: "Pending", value: SalesStatus.PENDING },
        { label: "In Progress", value: SalesStatus.IN_PROGRESS },
        { label: "Completed", value: SalesStatus.COMPLETED },
        { label: "Refunded", value: SalesStatus.REFUNDED },
        { label: "Cancelled", value: SalesStatus.CANCELLED },
        { label: "Voided", value: SalesStatus.VOIDED },
      ],
    },
  ];

  const today = new Date();
  today.setHours(0, 0, 0, 0); // start of today

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const todaysPaymentMethodsTotal = response?.data
    ?.filter((sale) => {
      const saleDate = new Date(sale.salesCreatedAt);
      return saleDate >= today && saleDate < tomorrow;
    })
    .reduce(
      (acc, sale) => {
        sale.paymentMethods?.forEach((pm) => {
          const method = pm.payMetName;
          const amount = Number(pm.salesPaymentAmount);

          acc[method] = (acc[method] || 0) + amount;
        });

        return acc;
      },
      {} as Record<string, number>,
    );
  const handleSave = useCallback(
    (newFilters: Record<string, string[]>) => {
      const currentParams = new URLSearchParams(window.location.search);
      const filterKeys = [...salesFilterConfig.map((f) => f.id), "branch"];

      filterKeys.forEach((key) => currentParams.delete(key));

      Object.entries(newFilters).forEach(([key, values]) => {
        values.forEach((value) => currentParams.append(key, value));
      });

      router.push(`?${currentParams.toString()}`);
    },
    [router, salesFilterConfig],
  );

  const handleClickCreateSales = () => {
    const resolvedStoreId =
      selectedStoreId ??
      (Array.isArray(stores)
        ? stores.find((s) => s.storeName === defaultStoreFromUrl)?.storeId
        : undefined) ??
      (storeId || undefined);

    if (!resolvedStoreId) {
      toast.error("Select a store first!");
      return;
    }

    setCreateSalesStoreId(resolvedStoreId);
    setShowCreateSales(true);
  };

  return (
    <PageLayout className="p-2 gap-1 2xl:gap-2">
      <>
        <div className="flex justify-between">
          {" "}
          <PageHeader title={"Sales"} subtitle="Manage sales" />
          <div className="flex gap-2">
            {canCreateSales && (
              <Button
                label={"Create Sales"}
                size="sm"
                icon={Plus}
                onClick={handleClickCreateSales}
              />
            )}
            <Button
              label={showBreakdown ? "Hide Breakdowns" : "Show Breakdowns"}
              size="sm"
              icon={Eye}
              onClick={() => setShowBreakdown((prev) => !prev)}
            />
          </div>
        </div>

        <div className="flex flex-1 flex-col min-h-0 gap-2">
          {showBreakdown && (
            <div className="grid grid-cols-4 gap-3  xl:grid-cols-4">
              <StatCard
                icon={PhilippinePeso}
                title="Total Sales"
                value={formatPeso(totalSales)}
                headerRight={
                  hasTableDateRange ? (
                    <span className="text-[10px] 2xl:text-xs text-gray-500 whitespace-nowrap">
                      Custom range
                    </span>
                  ) : (
                    <div className="w-20 2xl:w-28">
                      <DynamicDropdown
                        options={[
                          { label: "Today", value: "today" },
                          { label: "This Week", value: "week" },
                          { label: "This Month", value: "month" },
                          { label: "This Year", value: "year" },
                          { label: "All Time", value: "all" },
                        ]}
                        value={salesPeriod}
                        onChange={(value) =>
                          setSalesPeriod(
                            (value ||
                              "month") as typeof salesPeriod,
                          )
                        }
                        placeholder="This Month"
                        icon={<></>}
                        size="xs"
                      />
                    </div>
                  )
                }
              >
                <PaymentBreakdown
                  data={totalSalesPaymentMethods}
                  total={totalSales}
                />
              </StatCard>

              <StatCard
                icon={CalendarCheck}
                title="Total Orders"
                value={totalCountSales}
                bgColor="bg-emerald-50"
                textColor="text-emerald-600"
                subtitle="All time orders"
                trend={ordersTrend}
                trendColor="#16a34a"
                growthPct={ordersGrowthPct}
              />

              <StatCard
                icon={Users}
                title="Total Customers"
                value={totalCustomer}
                bgColor="bg-amber-50"
                textColor="text-amber-600"
                subtitle="Unique customers"
                trend={customersTrend}
                trendColor="#f59e0b"
                growthPct={customersGrowthPct}
              />

              <StatCard
                icon={Calendar}
                title="Today's Sales"
                value={formatPeso(todaySales)}
                bgColor="bg-blue-50"
                textColor="text-blue-600"
                subtitle="As of today 11:59 PM"
                trend={todaySalesTrend}
                trendColor="#3b82f6"
              />
            </div>
          )}
          <div className="flex gap-2">
            <Button
              label="Sales"
              size="sm"
              isRounded={false}
              color={salesView === "sales" ? "primary" : "neutral"}
              hasBorder
              onClick={() => setSalesView("sales")}
            />
            <Button
              label="By Product Variant"
              size="sm"
              isRounded={false}
              color={salesView === "by-variant" ? "primary" : "neutral"}
              hasBorder
              onClick={() => setSalesView("by-variant")}
            />
          </div>
          <div className="flex-1 min-h-0  flex flex-col justify-between overflow-hidden">
            {salesView === "by-variant" ? (
              <SalesByProductVariantTab storeId={storeId} user={user} />
            ) : (
              <Table
                onDateRangeChange={handleDateRangeChange}
                loading={isLoading}
                showDateRange
                filterConfig={salesFilterConfig}
                showFilter
                onRowSelection={(row) => {
                  router.push(`/sales/${row.salesId}`);
                }}
                onSave={handleSave}
                renderTopActions={
                  <div className="flex gap-2">
                    <DynamicDropdown
                      options={[
                        { label: "Sales", value: "Sales" },
                        { label: "Customer", value: "Customer" },
                      ]}
                      onChange={function (value: string | number): void {
                        if (value) {
                          setIsReport(value as "Customer" | "Sales");
                          setShowModal("report");
                        } else {
                          setIsReport(null);
                          setShowModal(null);
                        }
                      }}
                      placeholder={"Report"}
                      icon={<FileText className="w-3.5 h-3.5 font-semibold" />}
                      size="sm"
                    />
                  </div>
                }
                searchUrl="/sales"
                isRounded={false}
                columns={
                  user?.empPosition === "supervisor" ||
                  user?.empPosition === "staff"
                    ? columns
                    : adminColumns
                }
                data={response?.data ?? []}
                maxHeight="h-full"
                showActions
                renderActions={(row) => (
                  <div className="flex justify-center">
                    <IconButton
                      onClick={function (): void {
                        router.push(`/sales/${row.salesId}`);
                      }}
                      label={"View"}
                      bg={"gray"}
                      icon={<Eye className="w-4 h-4" />}
                    />
                  </div>
                )}
                totalCount={response?.count}
                showPagination
                addContentLeftTitle={
                  !hasStore || isAdmin ? (
                    <div>
                      <DynamicDropdown
                        size="sm"
                        options={storeOptions}
                        value={defaultStoreFromUrl}
                        onChange={function (value: string | number): void {
                          if (value) {
                            const findStore = Array.isArray(stores)
                              ? stores.find((i) => i.storeName === value)
                              : undefined;
                            setSelectedStoreId(findStore?.storeId ?? null);
                            const url = new URL(window.location.href);
                            url.searchParams.set("store", String(value));
                            router.push(url.toString());
                          } else {
                            const url = new URL(window.location.href);
                            setSelectedStoreId(null);
                            url.searchParams.delete("store"); // remove 'store'
                            router.push(url.toString());
                          }
                        }}
                        placeholder={`Store (${storeOptions.length})`}
                        icon={<Store className="w-4 h-4" />}
                      />
                    </div>
                  ) : (
                    <></>
                  )
                }
              />
            )}
          </div>
        </div>
      </>
      <Modal
        title="Create Sales"
        isOpen={showCreateSales}
        onClose={() => {
          setShowCreateSales(false);
          setCreateSalesStoreId(null);
        }}
        size="xl"
        className="h-[95%]"
      >
        {createSalesStoreId && (
          <CreateSalesModal
            storeId={createSalesStoreId}
            user={user}
            onCreated={() => mutateSales()}
            onClose={() => {
              setShowCreateSales(false);
              setCreateSalesStoreId(null);
            }}
          />
        )}
      </Modal>
      <Modal
        title={
          showModal === "report"
            ? isReport === "Customer"
              ? "Customer Report"
              : isReport === "Sales"
                ? "Sales Report"
                : "Report"
            : showModal === "export"
              ? "Export Sales"
              : ""
        }
        isOpen={showModal !== null}
        onClose={function (): void {
          setShowModal(null);
        }}
        size="xl"
        className="h-[95%]"
      >
        {showModal === "report" ? (
          isReport === "Customer" ? (
            <SalesReportModal apiUrl={apiUrl} showReportType={isReport} />
          ) : isReport === "Sales" ? (
            <SalesReportModal apiUrl={apiUrl} showReportType={isReport} />
          ) : (
            "Report"
          )
        ) : showModal === "export" ? (
          "Export Sales"
        ) : (
          ""
        )}
      </Modal>
      <Modal
        isOpen={showSalesBreakdown !== null}
        onClose={function (): void {
          setShowSalesBreakdown(null);
        }}
        title={
          showSalesBreakdown === "totalSales"
            ? "Total Sales Payments"
            : "Today's Sales Payments"
        }
      >
        {showSalesBreakdown === "totalSales" ? (
          <div className="flex flex-col flex-1 overflow-y-auto gap-3">
            {/* Total */}
            <h1 className="text-2xl font-medium text-gray-900 tracking-tight leading-none">
              {formatPeso(totalSales)}
            </h1>

            {/* Payment method rows */}
            <div className="flex flex-col gap-2">
              {totalSalesPaymentMethods?.map((method: any) => {
                const amount = Number(method.salesPayAmount);
                const pct = totalSales > 0 ? (amount / totalSales) * 100 : 0;

                return (
                  <div key={method.payMetName} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-500">
                        {method.payMetName}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400 tabular-nums">
                          {pct.toFixed(0)}%
                        </span>
                        <span className="text-[11px] font-medium text-gray-900 tabular-nums">
                          {formatPeso(amount)}
                        </span>
                      </div>
                    </div>
                    {/* Track + fill */}
                    <div className="h-[3px] w-full rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-primary-1 transition-all duration-500 ease-out"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col flex-1 overflow-y-auto gap-3">
            {/* Total */}
            <h1 className="text-2xl font-medium text-gray-900 tracking-tight leading-none">
              {formatPeso(todaySales)}
            </h1>

            {/* Payment method rows */}
            <div className="flex flex-col gap-2">
              {todaysSalesPaymentMethods?.map((method: any) => {
                const amount = Number(method.salesPayAmount);
                const pct = todaySales > 0 ? (amount / todaySales) * 100 : 0;

                return (
                  <div key={method.payMetName} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-500">
                        {method.payMetName}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400 tabular-nums">
                          {pct.toFixed(0)}%
                        </span>
                        <span className="text-[11px] font-medium text-gray-900 tabular-nums">
                          {formatPeso(amount)}
                        </span>
                      </div>
                    </div>
                    {/* Track + fill */}
                    <div className="h-[3px] w-full rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-primary-1 transition-all duration-500 ease-out"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Modal>
    </PageLayout>
  );
};

export default SalesPage;
