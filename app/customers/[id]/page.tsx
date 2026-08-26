"use client";

import Button from "@/components/shared/Button";
import LoaderComponent from "@/components/shared/LoaderComponent";
import Modal from "@/components/shared/Modal";
import PageLayout from "@/components/shared/PageLayout";
import { DisplayCustomerDto } from "@/dtos/customer.dto";
import { ApiResponse } from "@/types/api";
import { fetcher } from "@/utils/fetcher";
import {
  CalendarDays,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";
import useSWR from "swr";
import EditCustomerModal from "../components/EditCustomerModal";
import { formatDateToWords } from "@/utils/formatDateToWords";
import { formatPeso } from "@/utils/formatPeso";
import CusRecentActivity from "./components/CusRecentActivity";
import { PaymentBreakdown } from "@/app/sales/components/PaymentBreakdown";

const Page = () => {
  const params = useParams();
  const router = useRouter();
  const [isShowEdit, setIsShowEdit] = useState(false);
  const { id } = params;

  // Shared with CusRecentActivity below, so "Total Spent" up top always
  // reflects the same range as the sales list, instead of always being
  // the customer's lifetime total regardless of what range is selected.
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: "",
    to: "",
  });

  const customerUrl = useMemo(() => {
    if (!id) return null;

    const searchParams = new URLSearchParams();
    if (dateRange.from) searchParams.set("from", dateRange.from);
    if (dateRange.to) searchParams.set("to", dateRange.to);

    const query = searchParams.toString();
    return `/api/customers/${id}${query ? `?${query}` : ""}`;
  }, [id, dateRange]);

  const { data, isLoading, mutate } = useSWR<ApiResponse<DisplayCustomerDto[]>>(
    customerUrl,
    fetcher,
  );

  const customer = data?.data[0];
  const initial = customer?.customerName.charAt(0);
  if (isLoading) return <LoaderComponent />;

  if (!customer) return <div>No Customer found with that ID: {id}</div>;

  return (
    <PageLayout className="p-4 flex flex-col xs:min-h-screen overflow-y-auto 2xl:h-full 2xl:overflow-hidden">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-primary-1 transition-colors"
      >
        <span className="text-base">←</span>
        Back to Customers
      </button>
      <div className="p-2 flex  items-center gap-2">
        <div className="h-10 w-10 2xl:h-20 2xl:w-20 rounded-full text-sm 2xl:text-4xl bg-primary-1 flex items-center justify-center text-white font-semibold">
          {initial}
        </div>
        <div className="flex flex-col justify-between gap-1 2xl:gap-2">
          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-sm 2xl:text-2xl">
              {customer.customerName}
            </h1>
            <span className="text-xs 2xl:text-md font-medium">
              ({customer.customerType.toLocaleLowerCase()})
            </span>
          </div>
          <div>
            <span className="text-[10px] 2xl:text-xs bg-green-100 text-green-800 py-1 px-2 rounded font-medium border border-green-300">
              Active Customer
            </span>
          </div>
        </div>
      </div>
      <div className="flex flex-col 2xl:flex-row gap-2 rounded overflow-visible 2xl:flex-1 2xl:min-h-0 2xl:overflow-hidden">
        <div className="flex-[2] flex flex-col gap-2 border-border border rounded bg-white shadow">
          <div className="flex justify-between p-2">
            <h1 className=" font=- text-sm font-medium">CUSTOMER DETAILS</h1>
            <div>
              <Button
                label="Edit"
                size="sm"
                icon={Pencil}
                color="outline"
                hasBorder={false}
                isRounded={false}
                onClick={() => setIsShowEdit(true)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 2xl:grid-cols-1 gap-4 mt-4 p-2">
            <div className="flex gap-2 items-center">
              <div className="h-7 w-7 rounded bg-primary-1/10 flex items-center justify-center">
                <Phone size={14} className="text-primary-1" />
              </div>
              <div className="flex flex-col justify-center">
                <label className="text-gray-600 text-xs font-medium">
                  Phone
                </label>
                <span className="text-xs font-medium">
                  {customer.customerPhone || "-"}
                </span>
              </div>
            </div>

            <div className="flex gap-2 items-center">
              <div className="h-7 w-7 rounded bg-primary-1/10 flex items-center justify-center">
                <Mail size={14} className="text-primary-1" />
              </div>
              <div className="flex flex-col justify-center">
                <label className="text-gray-600 text-xs font-medium">
                  Email
                </label>
                <span className="text-xs font-medium">
                  {customer.customerEmail || "-"}
                </span>
              </div>
            </div>

            <div className="flex gap-2 items-center">
              <div className="h-7 w-7 rounded bg-primary-1/10 flex items-center justify-center">
                <MapPin size={14} className="text-primary-1" />
              </div>
              <div className="flex flex-col justify-center">
                <label className="text-gray-600 text-xs font-medium">
                  Address
                </label>
                <span className="text-xs font-medium">
                  {customer.customerAddress || "-"}
                </span>
              </div>
            </div>

            <div className="flex gap-2 items-center">
              <div className="h-7 w-7 rounded bg-primary-1/10 flex items-center justify-center">
                <CalendarDays size={14} className="text-primary-1" />
              </div>
              <div className="flex flex-col justify-center">
                <label className="text-gray-600 text-xs font-medium">
                  Created At
                </label>
                <span className="text-xs font-medium">
                  {formatDateToWords(customer.customerCreatedAt ?? "")}
                </span>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <div className="h-7 w-7 rounded bg-primary-1/10 flex items-center justify-center">
                <CalendarDays size={14} className="text-primary-1" />
              </div>
              <div className="flex flex-col justify-center">
                <label className="text-gray-600 text-xs font-medium">
                  Last updated
                </label>
                <span className="text-xs font-medium">
                  {formatDateToWords(customer.customerUpdatedAt ?? "")}
                </span>
              </div>
            </div>

            <div className="flex gap-2 items-center">
              <div className="h-7 w-7 rounded bg-primary-1/10 flex items-center justify-center">
                <ShieldCheck size={14} className="text-primary-1" />
              </div>
              <div className="flex flex-col justify-center">
                <label className="text-gray-600 text-xs font-medium">
                  Online Access
                </label>
                <span className="text-xs font-medium">
                  {customer.cusAccId
                    ? customer.emailVerified
                      ? "Verified"
                      : "Not Verified"
                    : "No Access"}
                </span>
              </div>
            </div>

            {customer.cusAccId && (
              <div className="flex gap-2 items-center">
                <div className="h-7 w-7 rounded bg-primary-1/10 flex items-center justify-center">
                  <CalendarDays size={14} className="text-primary-1" />
                </div>
                <div className="flex flex-col justify-center">
                  <label className="text-gray-600 text-xs font-medium">
                    Access Created
                  </label>
                  <span className="text-xs font-medium">
                    {formatDateToWords(customer.accountCreatedAt ?? "")}
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className="mt-auto border-t border-border p-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-border bg-gray-50 p-3 text-center">
                <p className="text-xs 2xl:text-sm  font-semibold text-primary-1">
                  {Number(customer.totalSpent) !== 0
                    ? formatPeso(customer.totalSpent)
                    : "-"}
                </p>
                <p className="mt-1 text-[11px] 2xl:text-xs text-gray-500">
                  Total Spent{dateRange.from && dateRange.to ? " (selected range)" : ""}
                </p>
              </div>

              <div className="rounded-lg border border-border bg-gray-50 p-3 text-center">
                <p className="text-sm font-semibold text-primary-1">
                  {customer.lastVisit
                    ? formatDateToWords(customer.lastVisit)
                    : "-"}
                </p>
                <p className="mt-1 text-xs text-gray-500">Last Visit</p>
              </div>

              <div className="rounded-lg border border-border bg-gray-50 p-3 text-center">
                <p className="text-sm font-semibold text-primary-1">
                  {customer.firstVisit
                    ? formatDateToWords(customer.firstVisit)
                    : "-"}
                </p>
                <p className="mt-1 text-xs text-gray-500">First Visit</p>
              </div>
            </div>
            {Boolean(customer.paymentMethods?.length) && (
              <div className="mt-4">
                <p className="mb-2 text-[11px] 2xl:text-xs font-medium text-gray-500">
                  Payment Methods
                </p>
                <PaymentBreakdown
                  data={customer.paymentMethods}
                  total={Number(customer.totalSpent)}
                />
              </div>
            )}
          </div>
        </div>
        <CusRecentActivity
          customerId={customer.customerId}
          storeId={customer.storeId}
          dateRange={dateRange}
          setDateRange={setDateRange}
        />
      </div>
      <Modal
        isOpen={isShowEdit}
        onClose={function (): void {
          setIsShowEdit(false);
        }}
        title="Edit Customer"
      >
        <EditCustomerModal
          data={customer}
          mutate={mutate}
          onClick={() => setIsShowEdit(false)}
        />
      </Modal>
    </PageLayout>
  );
};

export default Page;
