import IconButton from "@/components/shared/IconButton";
import PageHeader from "@/components/shared/PageHeader";
import PageLayout from "@/components/shared/PageLayout";
import Table, { Column } from "@/components/shared/Table";
import { DisplaySalesDto } from "@/dtos/sales.dto";
import { UserAuth } from "@/hooks/useSession";
import { ApiResponse } from "@/types/api";
import { Sales } from "@/types/sales";
import { fetcher } from "@/utils/fetcher";
import { formatDateToWords } from "@/utils/formatDateToWords";
import { formatPeso } from "@/utils/formatPeso";
import {
  Calendar,
  CalendarCheck,
  Clipboard,
  DollarSign,
  Download,
  Eye,
  FileText,
  PhilippinePeso,
  TrendingUp,
  Users,
} from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import SalesCard from "./components/SalesCard";
import BigCard from "@/components/shared/BigCard";
import SellingProductCard from "./components/SellingProductCard";
import SelectedSalesPage from "./SelectedSalesPage";
import Button from "@/components/shared/Button";
import Modal from "@/components/shared/Modal";
import { useSearchParams } from "next/navigation";
interface SalesPageProps {
  storeId: number;
  user: UserAuth | null;
}
const columns: Column<DisplaySalesDto>[] = [
  { key: "#", name: "#", selector: (_row, index) => index + 1 },
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
    key: "salesTotalAmount",
    name: "Total Amount",
    selector: (row) => (
      <span className="font-semibold">{formatPeso(row.salesTotalAmount)}</span>
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
                      : paymentMethod[0].salesPaymentAmount
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
                        : method.salesPaymentAmount
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
    name: "Created At",
    selector: (row) => formatDateToWords(row.salesCreatedAt ?? ""),
  },
];
const SalesPage = ({ storeId, user }: SalesPageProps) => {
  const searchParams = useSearchParams();
  const [seletectedSales, setSelectedSales] = useState<DisplaySalesDto | null>(
    null
  );
  const [showModal, setShowModal] = useState<"report" | "export" | null>(null);
  const [isViewSales, setIsViewSales] = useState(false);
  const url = `/api/sales/${storeId}`;
  const apiUrl = useMemo(() => {
    if (!storeId) return null;

    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const category = searchParams.get("category") || "";
    const unit = searchParams.get("unit") || "";
    const limit = searchParams.get("limit") || "";
    const page = searchParams.get("page") || "1";

    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (status) params.append("status", status);
    if (category) params.append("category", category);
    if (unit) params.append("unit", unit);
    if (limit) params.append("limit", limit);
    params.append("page", page);

    return `${url}?${params.toString()}`;
  }, [storeId, searchParams]);
  const {
    data: responseDetails,

    isLoading: isLoadingDetails,
  } = useSWR(user && storeId ? `/api/sales/${storeId}/details` : null, fetcher);
  console.log({ responseDetails });
  const {
    data: response,
    mutate,
    isLoading,
  } = useSWR<ApiResponse<DisplaySalesDto[]>>(
    user && storeId ? apiUrl : null,
    fetcher
  );
  const handleDateRangeChange = useCallback(
    (rangeData: { from: string; to: string }) => {
      console.log("Selected range:", rangeData);
      // setRange(rangeData);
    },
    []
  );
  const details = responseDetails?.data[0];
  const totalSales = details?.totalSales ?? 0;
  const totalCountSales = details?.totalCountSales ?? 0;
  const totalCustomer = details?.totalCustomer ?? 0;
  const todaySales = details?.todaySales ?? 0;
  console.log({ details });
  return (
    <PageLayout className="p-2 gap-2">
      {isViewSales && seletectedSales ? (
        <>
          <div className="flex-1 overflow-y-auto">
            <SelectedSalesPage
              salesData={seletectedSales}
              onBack={() => {
                setSelectedSales(null);
                setIsViewSales(false);
              }}
            />
          </div>
        </>
      ) : (
        <>
          <div className="flex justify-between">
            <PageHeader title={"Sales"} subtitle="Manage sales" />
            <div className="p-2  w-[35%]"></div>
          </div>
          <div className="flex h-full gap-2">
            <div className="flex flex-1 flex-col h-full gap-2">
              <div className="grid grid-cols-4 gap-2 h-20">
                <SalesCard
                  icon={PhilippinePeso}
                  title="Total Sales"
                  value={`${formatPeso(totalSales)}`}
                />
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
                />
              </div>
              <div className="flex-1 min-h-0 flex flex-col">
                <Table
                  onDateRangeChange={handleDateRangeChange}
                  loading={isLoading}
                  showDateRange
                  filterConfig={[]}
                  showFilter
                  onRowSelection={(row) => {
                    setSelectedSales(row);
                    setIsViewSales(true);
                  }}
                  renderTopActions={
                    <div className="flex gap-2">
                      <div>
                        <Button
                          size="sm"
                          hasBorder={false}
                          color="outline"
                          label="Report"
                          icon={
                            <FileText className="w-3.5 h-3.5 font-semibold" />
                          }
                          onClick={() => {
                            setShowModal("report");
                          }}
                        />
                      </div>
                      <div>
                        <Button
                          size="sm"
                          hasBorder={false}
                          color="outline"
                          label="Export"
                          icon={
                            <Download className="w-3.5 h-3.5 font-semibold" />
                          }
                          onClick={() => {
                            setShowModal("export");
                          }}
                        />
                      </div>
                    </div>
                  }
                  searchUrl="/sales"
                  isRounded={false}
                  columns={columns}
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
                  totalCount={100}
                />
              </div>
            </div>
            <div className="w-[20%]">
              <BigCard title={"Today's Sold Products"} isRounded={false}>
                <div className="flex flex-col">
                  <SellingProductCard />
                </div>
              </BigCard>
            </div>
          </div>
        </>
      )}
      <Modal
        title={
          showModal === "report"
            ? "Sales Report"
            : showModal === "export"
            ? "Export Sales"
            : ""
        }
        isOpen={showModal !== null}
        onClose={function (): void {
          setShowModal(null);
        }}
        children={undefined}
        size="xl"
        className="h-[95%]"
      ></Modal>
    </PageLayout>
  );
};

export default SalesPage;
