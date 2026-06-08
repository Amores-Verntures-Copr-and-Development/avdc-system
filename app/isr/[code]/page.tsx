"use client";

import Button from "@/components/shared/Button";
import { Card, CardContent, CardHeader } from "@/components/shared/CustomCard";
import Input from "@/components/shared/Input";
import LoaderComponent from "@/components/shared/LoaderComponent";
import Modal from "@/components/shared/Modal";
import PageHeader from "@/components/shared/PageHeader";
import Table, { Column } from "@/components/shared/Table";
import { DisplayISRPurchaserDTO } from "@/dtos/isr.dto";
import { ApiResponse } from "@/types/api";
import { InterStoreRequests } from "@/types/isr";
import { fetcher } from "@/utils/fetcher";
import { formatDateToWords } from "@/utils/formatDateToWords";
import { Plus, Store, User } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useState } from "react";
import useSWR from "swr";
import AddPurchaserISR from "./components/AddPurchaserISR";

const Page = () => {
  const params = useParams();
  const router = useRouter();
  const code = params.code;

  const [showModals, setShowModals] = useState<
    null | "purchaser" | "receiver" | "stores"
  >(null);

  const { data: response, isLoading } = useSWR<
    ApiResponse<InterStoreRequests[]>
  >(code ? `/api/isr/${code}` : null, fetcher);

  const isr = response?.data?.[0];

  const { data: isrPuResponse, mutate: isrPuMutate } = useSWR<
    ApiResponse<DisplayISRPurchaserDTO[]>
  >(isr ? `/api/isr/${isr.isrCode}/purchaser` : null, fetcher);

  const isrPuColumn: Column<DisplayISRPurchaserDTO>[] = [
    {
      key: "#",
      name: "#",
      selector: (_row, index) => index + 1,
    },
    {
      key: "purchaser",
      name: "Purchaser",
      selector: (row) => row.purchaser,
    },
    {
      key: "creator",
      name: "Added by",
      selector: (row) => row.creator,
    },
    {
      key: "isrPuCreatedAt",
      name: "Date Added",
      selector: (row) => formatDateToWords(row.isrPurCreatedAt),
    },
  ];

  if (isLoading) return <LoaderComponent />;

  return (
    <div
      className="
  flex min-h-screen flex-col gap-2 p-2
  overflow-y-auto
  2xl:h-[calc(100vh-1rem)] 2xl:min-h-0 2xl:overflow-hidden
"
    >
      <button
        onClick={() => router.back()}
        className="flex shrink-0 items-center gap-2 text-sm text-gray-600 transition-colors hover:text-gray-900"
      >
        <svg
          className="h-4 w-4"
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

      <div className="shrink-0">
        <PageHeader
          title={`ISR - ${isr?.isrName ?? ""}`}
          subtitle="Manage ISR setup and assign purchasers, request handlers, and stores"
        />
      </div>

      <Card className="shrink-0">
        <CardHeader>
          <h1 className="text-sm font-semibold 2xl:text-lg">Details</h1>
        </CardHeader>

        <CardContent className="flex gap-2">
          <Input disabled label="Name" sizes="sm" value={isr?.isrName ?? ""} />
          <Input disabled label="Code" sizes="sm" value={isr?.isrCode ?? ""} />
        </CardContent>
      </Card>

      <div
        className="
  grid grid-cols-1 gap-2 2xl:gap-4
  2xl:min-h-0 2xl:flex-1 2xl:grid-cols-2 2xl:overflow-hidden
"
      >
        <Card
          className="
  flex flex-col overflow-hidden
  min-h-[320px]
  2xl:min-h-0
"
        >
          <CardHeader className="shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-primary-1">
                  <User className="h-5 w-5" />
                  <h1 className="text-sm font-semibold">
                    Purchasers ({isrPuResponse?.count ?? 0})
                  </h1>
                </div>

                <span className="text-xs font-normal text-gray-700">
                  Select one or more purchasers who can handle purchase orders.
                </span>
              </div>

              <div>
                {" "}
                <Button
                  label="Add Purchaser"
                  size="sm"
                  icon={Plus}
                  onClick={() => setShowModals("purchaser")}
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="min-h-0 flex-1 overflow-hidden p-0">
            <div className="h-full min-h-0 overflow-y-auto p-2">
              <Table
                columns={isrPuColumn}
                data={isrPuResponse?.data ?? []}
                isRounded={false}
                maxHeight="h-full"
              />
            </div>
          </CardContent>
        </Card>

        <Card
          className="
  flex flex-col overflow-hidden
  min-h-[320px]
  2xl:min-h-0
"
        >
          <CardHeader className="shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-primary-1">
                  <User className="h-5 w-5" />
                  <h1 className="text-sm font-semibold">
                    Receivers (Request Handler)
                  </h1>
                </div>

                <span className="text-xs font-normal text-gray-700">
                  Select one or more handlers who will receive, process
                  requests, and provide stocks.
                </span>
              </div>

              <div>
                {" "}
                <Button label="Add Receiver" size="sm" icon={Plus} />
              </div>
            </div>
          </CardHeader>

          <CardContent className="min-h-0 flex-1 overflow-hidden p-0">
            <div className="h-full min-h-0 overflow-y-auto p-2">
              <Table
                columns={[]}
                data={[]}
                isRounded={false}
                maxHeight="h-full"
              />
            </div>
          </CardContent>
        </Card>

        <Card
          className="
  flex flex-col overflow-hidden
  min-h-[320px]
  2xl:min-h-0
"
        >
          <CardHeader className="shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-primary-1">
                  <Store className="h-5 w-5" />
                  <h1 className="text-sm font-semibold">Stores</h1>
                </div>

                <span className="text-xs font-normal text-gray-700">
                  Select one or more stores that can request under this ISR.
                </span>
              </div>

              <div>
                <Button label="Add Store" size="sm" icon={Plus} />
              </div>
            </div>
          </CardHeader>

          <CardContent className="min-h-0 flex-1 overflow-hidden p-0">
            <div className="h-full min-h-0 overflow-y-auto p-2">
              <Table
                columns={[]}
                data={[]}
                isRounded={false}
                maxHeight="h-full"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {showModals !== null && (
        <Modal
          isOpen={showModals !== null}
          onClose={() => setShowModals(null)}
          title={showModals === "purchaser" ? "Add ISR Purchaser" : ""}
        >
          {showModals === "purchaser" && isr ? (
            <AddPurchaserISR
              data={isr}
              onClose={() => setShowModals(null)}
              mutate={isrPuMutate}
            />
          ) : null}
        </Modal>
      )}
    </div>
  );
};

export default Page;
