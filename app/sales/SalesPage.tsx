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
  Store,
  Users,
} from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import SalesCard from "./components/SalesCard";

import SelectedSalesPage from "./SelectedSalesPage";
import Button from "@/components/shared/Button";
import Modal from "@/components/shared/Modal";
import { useSearchParams, useRouter } from "next/navigation";
import DynamicDropdown, {
  DropdownOption,
} from "@/components/shared/DynamicDropdown";
import { useStores } from "@/hooks/userStore";
import { useDebounce } from "@/hooks/useDebounce";

import SalesReportModal from "./components/SalesReportModal";
import { FilterConfig, FilterOption } from "@/components/shared/FilterDropDown";
import { PaymentMethods } from "@/types/payment-methods";
import SalesStatusBadge from "./components/SalesStatusBadge";
import { SalesStatus } from "@/types/sales";

interface SalesPageProps {
  storeId: number;
  user: UserAuth | null;
  hasStore: boolean;
  isAdmin: boolean;
}

const SalesPage = ({ storeId, user, hasStore, isAdmin }: SalesPageProps) => {
  const url =
    user?.empPosition === "supervisor" || user?.empPosition === "staff"
      ? `/api/sales/${storeId}`
      : `/api/sales`;
  const searchParams = useSearchParams();
  const limit = searchParams.get("limit") || "";
  const page = searchParams.get("page") || "1";
  const limitNumber = Number(limit) || 100; // default limit
  const pageNumber = Number(page) || 1;
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

    const params = new URLSearchParams();
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

  const columns: Column<DisplaySalesDto>[] = useMemo(() => {
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
        selector: (row) => {
          const discount = row.salesDiscounts || [];

          return (
            <div className="group relative">
              <select
                className="border border-gray-300 rounded px-1 py-0.5 xl:px-2 xl:py-1 w-full text-[10px] xl:text-xs bg-gray-50 appearance-none cursor-default"
                disabled
              >
                <option value="">
                  {discount.length > 1
                    ? `Discounts (${discount.filter((s) => s !== null).length})`
                    : discount.length === 1
                      ? `${discount[0].discountName} (${formatPeso(
                          discount[0].discountAmount,
                        )})`
                      : ``}
                </option>
              </select>
              {discount?.length > 0 && discount.some((d) => d !== null) && (
                <div className="absolute hidden group-hover:block z-10 top-full left-0 right-0 bg-white border border-gray-300 rounded shadow-lg max-h-40 overflow-y-auto">
                  {discount
                    .filter((d): d is (typeof discount)[0] => d !== null) // TypeScript-friendly
                    .map((disc) => (
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
        selector: (row) => {
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
    ];
  }, [response?.data]);
  const adminColumns: Column<DisplaySalesDto>[] = useMemo(
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
        selector: (row) => {
          const discount = row.salesDiscounts || [];

          return (
            <div className="group relative">
              <select
                className="border border-gray-300 rounded px-1 py-0.5 xl:px-2 xl:py-1 w-full text-[10px] xl:text-xs bg-gray-50 appearance-none cursor-default"
                disabled
              >
                <option value="">
                  {discount.length > 1
                    ? `Discounts (${discount.filter((s) => s !== null).length})`
                    : discount.length === 1
                      ? `${discount[0].discountName} (${formatPeso(
                          discount[0].discountAmount,
                        )})`
                      : ``}
                </option>
              </select>
              {discount?.length > 0 && discount.some((d) => d !== null) && (
                <div className="absolute hidden group-hover:block z-10 top-full left-0 right-0 bg-white border border-gray-300 rounded shadow-lg max-h-40 overflow-y-auto">
                  {discount
                    .filter((d): d is (typeof discount)[0] => d !== null) // TypeScript-friendly
                    .map((disc) => (
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
        key: "salesTotalAmount",
        name: "Total Amount",
        selector: (row) => (
          <span className="font-semibold">
            {formatPeso(row.salesTotalAmount)}
          </span>
        ),
      },
      { key: "totalItem", name: "Total Item" },
      {
        key: "method",
        name: "Payment Method",
        selector: (row) => {
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
    ],
    [response?.data],
  );
  const router = useRouter();
  const [seletectedSales, setSelectedSales] = useState<DisplaySalesDto | null>(
    null,
  );
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState<"report" | "export" | null>(null);
  const [isReport, setIsReport] = useState<"Customer" | "Sales" | null>(null);
  const [isViewSales, setIsViewSales] = useState(false);
  const { stores } = useStores({
    user,
    hasStore,
    isAdmin,
  });
  const { data: paymentMethodResponse = { data: [] } } = useSWR<{
    data: PaymentMethods[];
  }>(
    selectedStoreId ? `/api/payment-method/store/${selectedStoreId}/` : null,
    fetcher,
  );
  const paymentMethodOptions: FilterOption[] = paymentMethodResponse.data.map(
    (p) => ({ label: p.payMetName, value: String(p.payMetId) }),
  );

  const defaultStoreFromUrl = searchParams.get("store") || "";

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

    const store = searchParams.get("store");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (status) params.append("status", status);
    if (category) params.append("category", category);
    if (unit) params.append("unit", unit);

    if (store) params.append("store", store);
    if (to) params.append("to", to);
    if (from) params.append("from", from);

    return `${detailsUrl}?${params.toString()}`;
  }, [storeId, searchParams, user]);

  const debounceDetailsApi = useDebounce(apiDetailsUrl, 600);

  const { data: responseDetails } = useSWR(
    user ? debounceDetailsApi : null,
    fetcher,
  );

  const updateDataSelected = async () => {
    const data = await mutateSales();
    const findSales = data?.data.find(
      (s) => s.salesId === seletectedSales?.salesId,
    );
    if (findSales) {
      setSelectedSales(findSales);
    }
  };
  const handleDateRangeChange = useCallback(
    (rangeData: { from: string; to: string }) => {
      const { from, to } = rangeData;

      // Example: include them in the URL as query params
      const url = new URL(window.location.href);
      url.searchParams.set("from", from);
      url.searchParams.set("to", to);

      router.push(url.toString());
    },
    [router], // include dependencies
  );
  const details = responseDetails?.data[0];
  const totalSales = details?.totalSales ?? 0;
  const totalCountSales = details?.totalCountSales ?? 0;
  const totalCustomer = details?.totalCustomer ?? 0;
  const todaySales = details?.todaySales ?? 0;

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
      options: paymentMethodOptions ?? [],
    },
    {
      id: "customerType",
      label: "Walk-in",
      options: [],
    },
  ];
  const paymentMethodsTotal = response?.data.reduce(
    (acc, sale) => {
      sale.paymentMethods?.forEach((pm) => {
        const method = pm.payMetName;
        const amount = Number(pm.salesPaymentAmount);
        if (acc[method]) {
          acc[method] += amount;
        } else {
          acc[method] = amount;
        }
      });
      return acc;
    },
    {} as Record<string, number>,
  );
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

  return (
    <PageLayout className="p-2 gap-1 2xl:gap-2">
      {isViewSales && seletectedSales ? (
        <>
          <div className="flex-1 overflow-y-auto">
            <SelectedSalesPage
              salesData={seletectedSales}
              onBack={() => {
                setSelectedSales(null);
                setIsViewSales(false);
              }}
              mutateSales={updateDataSelected}
            />
          </div>
        </>
      ) : (
        <>
          <div className="flex justify-between">
            <PageHeader title={"Sales"} subtitle="Manage sales" />
          </div>

          <div className="flex flex-1 flex-col min-h-0 gap-2">
            <div className="flex 2xl:grid-cols-4 gap-2 min-h-10">
              <SalesCard
                icon={PhilippinePeso}
                title="Total Sales"
                value={`${formatPeso(totalSales)}`}
              >
                <div className="border-l border-l-gray-300 h-full flex-1 overflow-y-auto">
                  <div
                    className={`
        grid gap-y-1 gap-x-2
        ${
          Object.keys(paymentMethodsTotal ?? {}).length <= 3
            ? "grid-cols-3"
            : Object.keys(paymentMethodsTotal ?? {}).length <= 6
              ? "grid-cols-2"
              : "grid-cols-1"
        }
      `}
                  >
                    {Object.entries(paymentMethodsTotal ?? {}).map(
                      ([method, amount]) => (
                        <div
                          key={method}
                          className="flex flex-col items-center text-center"
                        >
                          <span className="font-medium text-[8px] text-gray-400 2xl:text-[10px] truncate w-full">
                            {method}
                          </span>
                          <span className="text-[8px] 2xl:text-[10px] truncate w-full">
                            {formatPeso(amount)}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </SalesCard>
              <SalesCard
                icon={CalendarCheck}
                title="Total Orders"
                value={totalCountSales}
                bgColor="bg-green-500/40"
                textColor="text-green-600"
              />
              <SalesCard
                icon={Users}
                title="Total Customer"
                value={totalCustomer}
                bgColor="bg-yellow-500/40"
                textColor="text-yellow-600"
              />
              <SalesCard
                icon={Calendar}
                title="Today's Sales"
                value={`${formatPeso(todaySales)}`}
                bgColor="bg-blue-500/40"
                textColor="text-blue-600"
              >
                <div className="border-l border-l-gray-300 h-full flex-1 overflow-y-auto">
                  <div
                    className={`
        grid gap-y-1 gap-x-2
        ${
          Object.keys(todaysPaymentMethodsTotal ?? {}).length <= 3
            ? "grid-cols-3"
            : Object.keys(todaysPaymentMethodsTotal ?? {}).length <= 6
              ? "grid-cols-2"
              : "grid-cols-1"
        }
      `}
                  >
                    {Object.entries(todaysPaymentMethodsTotal ?? {}).map(
                      ([method, amount]) => (
                        <div
                          key={method}
                          className="flex flex-col items-center text-center"
                        >
                          <span className="font-medium text-[8px] text-gray-400 2xl:text-[10px] truncate w-full">
                            {method}
                          </span>
                          <span className="text-[8px] 2xl:text-[10px] truncate w-full">
                            {formatPeso(amount)}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </SalesCard>
            </div>
            <div className="flex-1 min-h-0  flex flex-col justify-between overflow-hidden">
              <Table
                onDateRangeChange={handleDateRangeChange}
                loading={isLoading}
                showDateRange
                filterConfig={salesFilterConfig}
                showFilter
                onRowSelection={(row) => {
                  setSelectedSales(row);
                  setIsViewSales(true);
                }}
                onSave={() => {}}
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
                    <div>
                      <Button
                        size="sm"
                        hasBorder={false}
                        color="outline"
                        label="Export"
                        icon={Download}
                        onClick={() => {
                          setShowModal("export");
                        }}
                      />
                    </div>
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
                        setSelectedSales(row);
                        setIsViewSales(true);
                      }}
                      label={"View"}
                      bg={"gray"}
                      icon={<Eye className="w-4 h-4" />}
                    />
                  </div>
                )}
                totalCount={response?.count}
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
            </div>
          </div>
        </>
      )}
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
    </PageLayout>
  );
};

export default SalesPage;
