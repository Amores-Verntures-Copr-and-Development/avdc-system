"use client";

import Button from "@/components/shared/Button";
import { Card, CardContent, CardHeader } from "@/components/shared/CustomCard";
import Input from "@/components/shared/Input";
import LoaderComponent from "@/components/shared/LoaderComponent";
import PageHeader from "@/components/shared/PageHeader";
import PageLayout from "@/components/shared/PageLayout";
import Table from "@/components/shared/Table";
import { ApiResponse } from "@/types/api";
import { InterStoreRequests } from "@/types/isr";
import { fetcher } from "@/utils/fetcher";
import { Plus, Store, User } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React from "react";
import useSWR from "swr";

const page = () => {
  const params = useParams();
  const router = useRouter();
  const code = params.code;

  const { data: response, isLoading } = useSWR<
    ApiResponse<InterStoreRequests[]>
  >(code ? `/api/isr/${code}` : null, fetcher);

  const isr = response?.data[0];

  if (isLoading) return <LoaderComponent />;

  return (
    <PageLayout className="p-2 gap-2 overflow-y-auto">
      <button
        onClick={() => {
          router.back();
        }}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to ISR
      </button>
      <PageHeader
        title={`ISR - ${isr?.isrName}`}
        subtitle="Manage isr set up and assign purchaser, request handler and stores"
      />
      <Card>
        <CardHeader>
          <h1 className="font-semibold text-sm 2xl:text-lg">Details</h1>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input disabled label="Name" sizes="sm" value={isr?.isrName} />
          <Input disabled label="Code" sizes="sm" value={isr?.isrCode} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-2 2xl:gap-4 flex-1">
        <Card>
          <CardHeader className="">
            <div className="flex justify-between items-center">
              {" "}
              <div>
                <div className="flex text-primary-1 items-center gap-2">
                  <User className="h-5 w-5" />
                  <h1 className="font-semibold text-sm">Purchaser</h1>
                </div>
                <span className="text-xs text-gray-700 font-normal">
                  Select one or more purchasers who can handle purchase orders.
                </span>
              </div>
              <div>
                <Button label="Add Purchaser" size="sm" icon={Plus} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table
              columns={[]}
              data={[]}
              isRounded={false}
              maxHeight="h-full"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="">
            <div className="flex justify-between items-center">
              <div>
                {" "}
                <div className="flex text-primary-1 items-center gap-2">
                  <User className="h-5 w-5" />{" "}
                  <h1 className="font-semibold text-sm">
                    Receivers (Request Handler)
                  </h1>
                </div>
                <span className="text-xs text-gray-700 font-normal">
                  Select one or more handler who will receive, process request
                  and provide stocks.
                </span>
              </div>
              <div>
                <Button label="Add Receiver" size="sm" icon={Plus} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table
              columns={[]}
              data={[]}
              isRounded={false}
              maxHeight="h-full"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="">
            <div className="flex justify-between items-center">
              {" "}
              <div>
                <div className="flex text-primary-1 items-center gap-2">
                  <Store className="h-5 w-5" />{" "}
                  <h1 className="font-semibold text-sm">Stores</h1>
                </div>
                <span className="text-xs text-gray-700 font-normal">
                  Select one or more stores who can request under this ISR.
                </span>
              </div>
              <div>
                <Button label="Add Store" size="sm" icon={Plus} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table
              columns={[]}
              data={[]}
              isRounded={false}
              maxHeight="h-full"
            />
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default page;
