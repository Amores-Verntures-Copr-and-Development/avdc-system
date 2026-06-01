"use client";

import LoaderComponent from "@/components/shared/LoaderComponent";
import PageLayout from "@/components/shared/PageLayout";
import { DisplayCustomerDto } from "@/dtos/customer.dto";
import { ApiResponse } from "@/types/api";
import { fetcher } from "@/utils/fetcher";
import { useParams } from "next/navigation";
import React from "react";
import useSWR from "swr";

const page = () => {
  const params = useParams();

  const { id } = params;

  const { data, isLoading } = useSWR<ApiResponse<DisplayCustomerDto[]>>(
    id ? `/api/customers/${id}` : null,
    fetcher,
  );

  const customer = data?.data[0];
  const initial = customer?.customerName.charAt(0);
  if (isLoading) return <LoaderComponent />;

  if (!customer) return <div>No Customer found with that ID: {id}</div>;

  return (
    <PageLayout className="p-4 flex flex-col">
      <div className="p-2 flex items-center gap-2">
        <div className="h-20 w-20 rounded-full text-4xl bg-primary-1 flex items-center justify-center text-white font-semibold">
          {initial}
        </div>
        <div className="flex flex-col justify-between gap-3">
          <h1 className="font-semibold text-2xl">{customer.customerName}</h1>
          <span className="text-md font-medium">
            {" "}
            ({customer.customerType.toLocaleLowerCase()})
          </span>
          {/* <div className="flex flex-col gap-2">
            <span className="text-xs text-gray-600">
              Customer ID # {customer.customerId}
            </span>

            <span className="text-xs text-gray-600">
              Email: {customer.customerEmail ?? "No Email"}
            </span>
            <span className="text-xs text-gray-600">
              Phone: {customer.customerPhone ?? "No Email"}
            </span>
          </div> */}
        </div>
      </div>
      <div className="flex flex-1 gap-2 rounded">
        <div className="flex-[2] gap-2 flex-col border-border border rounded bg-white shadow p-2">
          <h1 className=" text-gray-600 text-lg font-medium">
            CUSTOMER DETAILS
          </h1>

          <div className="flex flex-col">
            <label className="text-gray-600 text-xs">Phone</label>
            <span>{customer.customerPhone}</span>
          </div>
          <div className="flex flex-col">
            <label className="text-gray-600 text-xs">Email</label>
            <span>{customer.customerEmail}</span>
          </div>
          <div className="flex flex-col">
            <label className="text-gray-600 text-xs">Phone</label>
            <span>{customer.customerPhone}</span>
          </div>
        </div>
        <div className="flex-[8] border-border border rounded bg-white shadow"></div>
      </div>
    </PageLayout>
  );
};

export default page;
