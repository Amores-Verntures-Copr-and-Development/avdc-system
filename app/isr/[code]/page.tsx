"use client";

import Button from "@/components/shared/Button";
import { Card, CardContent, CardHeader } from "@/components/shared/CustomCard";
import Input from "@/components/shared/Input";
import LoaderComponent from "@/components/shared/LoaderComponent";
import Modal from "@/components/shared/Modal";
import PageHeader from "@/components/shared/PageHeader";
import Table, { Column } from "@/components/shared/Table";
import {
  DisplayISRPurchaserDTO,
  DisplayISRRequestHandlerDTO,
  DisplayISRStoresDTO,
} from "@/dtos/isr.dto";
import { ApiResponse } from "@/types/api";
import { InterStoreRequests } from "@/types/isr";
import { fetcher } from "@/utils/fetcher";
import { formatDateToWords } from "@/utils/formatDateToWords";
import { Plus, Store, Trash, User } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useState } from "react";
import useSWR from "swr";
import AddPurchaserISR from "./components/AddPurchaserISR";
import AddStoresISR from "./components/AddStoresISR";
import AddReceiverISR from "./components/AddReceiverISR";
import IconButton from "@/components/shared/IconButton";
import ConfirmationModal from "@/components/shared/ConfirmationModal";
import toast from "react-hot-toast";
type RowSection =
  | {
      type: "purchaser";
      data: DisplayISRPurchaserDTO;
    }
  | {
      type: "receiver";
      data: DisplayISRRequestHandlerDTO;
    }
  | {
      type: "store";
      data: DisplayISRStoresDTO;
    };

const Page = () => {
  const params = useParams();
  const router = useRouter();
  const code = params.code;
  const [onRowSection, setOnRowSelection] = useState<RowSection | null>(null);
  const [showModals, setShowModals] = useState<
    null | "purchaser" | "receiver" | "stores"
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: response, isLoading } = useSWR<
    ApiResponse<InterStoreRequests[]>
  >(code ? `/api/isr/${code}` : null, fetcher);

  const isr = response?.data?.[0];

  const { data: isrPuResponse, mutate: isrPuMutate } = useSWR<
    ApiResponse<DisplayISRPurchaserDTO[]>
  >(isr ? `/api/isr/${isr.isrCode}/purchaser` : null, fetcher);
  const { data: isrRHResponse, mutate: isrRHMutate } = useSWR<
    ApiResponse<DisplayISRRequestHandlerDTO[]>
  >(isr ? `/api/isr/${isr.isrCode}/request-handler` : null, fetcher);
  const { data: isrSResponse, mutate: isrSMutate } = useSWR<
    ApiResponse<DisplayISRStoresDTO[]>
  >(isr ? `/api/isr/${isr.isrCode}/stores` : null, fetcher);

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

  const isrRHColumn: Column<DisplayISRRequestHandlerDTO>[] = [
    {
      key: "#",
      name: "#",
      selector: (_row, index) => index + 1,
    },
    {
      key: "requestHandler",
      name: "Name",
      selector: (row) => row.requestHandler,
    },
    {
      key: "creator",
      name: "Added by",
      selector: (row) => row.creator,
    },
    {
      key: "isrPuCreatedAt",
      name: "Date Added",
      selector: (row) => formatDateToWords(row.isrReqHanCreatedAt),
    },
  ];

  const isrSColumn: Column<DisplayISRStoresDTO>[] = [
    {
      key: "#",
      name: "#",
      selector: (_row, index) => index + 1,
    },
    {
      key: "storeName",
      name: "Store",
      selector: (row) => row.storeName,
    },
    {
      key: "creator",
      name: "Added by",
      selector: (row) => row.creator,
    },
    {
      key: "isrStoreCreatedAt",
      name: "Date Added",
      selector: (row) => formatDateToWords(row.isrStoreCreatedAt),
    },
  ];
  if (isLoading) return <LoaderComponent />;
  const confirmationInfo = (() => {
    if (!onRowSection) return "";

    switch (onRowSection.type) {
      case "purchaser":
        return `Are you sure you want to remove ${onRowSection.data.purchaser} as ${isr?.isrCode} Purchaser?`;

      case "receiver":
        return `Are you sure you want to remove ${onRowSection.data.requestHandler} as ${isr?.isrCode} Request Handler?`;

      case "store":
        return `Are you sure you want to remove ${onRowSection.data.storeName} from this ${isr?.isrCode}?`;
    }
  })();

  const handleRemovePurchaser = async () => {
    setIsSubmitting(true);
    try {
      if (onRowSection?.type !== "purchaser") {
        toast.error("Cannot proceed this action!");
        return;
      }
      if (!onRowSection?.data) {
        toast.error("No data found!");
        return;
      }

      const res = await fetch(
        `/api/isr/${isr?.isrCode}/purchaser/${onRowSection.data.isrPurId}`,
        {
          method: "DELETE",
        },
      );
      if (!res.ok) {
        toast.error("Failed to remove ISR Purchaser!");
        return;
      }
      toast.success("ISR Purchaser removed successfully!");
      isrPuMutate();
      setOnRowSelection(null);
    } catch (e) {
      toast.error("Failed to remove ISR Purchaser");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleRemovestore = async () => {
    setIsSubmitting(true);
    try {
      if (onRowSection?.type !== "store") {
        toast.error("Cannot proceed this action!");
        return;
      }
      if (!onRowSection?.data) {
        toast.error("No data found!");
        return;
      }

      const res = await fetch(
        `/api/isr/${isr?.isrCode}/stores/${onRowSection.data.isrStoreId}`,
        {
          method: "DELETE",
        },
      );
      if (!res.ok) {
        toast.error("Failed to remove ISR Store!");
        return;
      }
      toast.success("ISR Stores removed successfully!");
      isrSMutate();
      setOnRowSelection(null);
    } catch (e) {
      toast.error("Failed to remove ISR Store");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleRemoveRequestHandler = async () => {
    setIsSubmitting(true);
    try {
      if (onRowSection?.type !== "receiver") {
        toast.error("Cannot proceed this action!");
        return;
      }
      if (!onRowSection?.data) {
        toast.error("No data found!");
        return;
      }

      const res = await fetch(
        `/api/isr/${isr?.isrCode}/request-handler/${onRowSection.data.isrReqHanId}`,
        {
          method: "DELETE",
        },
      );
      if (!res.ok) {
        toast.error("Failed to remove ISR Request Handler!");
        return;
      }
      toast.success("ISR Request Handler removed successfully!");
      isrRHMutate();
      setOnRowSelection(null);
    } catch (e) {
      toast.error("Failed to remove ISR Request Handler");
    } finally {
      setIsSubmitting(false);
    }
  };
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
                showActions={true}
                renderActions={(row) => (
                  <div className="flex gap-2 justify-center items-center">
                    <IconButton
                      onClick={() => {
                        setOnRowSelection({
                          data: row,
                          type: "purchaser",
                        });
                      }}
                      label={"Remove"}
                      bg={"red"}
                      icon={<Trash className="w-3 h-3" />}
                    />
                  </div>
                )}
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
                    Request Handler ({isrRHResponse?.count})
                  </h1>
                </div>

                <span className="text-xs font-normal text-gray-700">
                  Select one or more handlers who will receive, process
                  requests, and provide stocks.
                </span>
              </div>

              <div>
                {" "}
                <Button
                  label="Add Receiver"
                  size="sm"
                  icon={Plus}
                  onClick={() => setShowModals("receiver")}
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="min-h-0 flex-1 overflow-hidden p-0">
            <div className="h-full min-h-0 overflow-y-auto p-2">
              <Table
                columns={isrRHColumn}
                data={isrRHResponse?.data ?? []}
                isRounded={false}
                maxHeight="h-full"
                showActions={true}
                renderActions={(row) => (
                  <div className="flex gap-2 justify-center items-center">
                    <IconButton
                      onClick={() => {
                        setOnRowSelection({
                          data: row,
                          type: "receiver",
                        });
                      }}
                      label={"Remove"}
                      bg={"red"}
                      icon={<Trash className="w-3 h-3" />}
                    />
                  </div>
                )}
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
                <Button
                  label="Add Store"
                  size="sm"
                  icon={Plus}
                  onClick={() => {
                    setShowModals("stores");
                  }}
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="min-h-0 flex-1 overflow-hidden p-0">
            <div className="h-full min-h-0 overflow-y-auto p-2">
              <Table
                columns={isrSColumn}
                data={isrSResponse?.data ?? []}
                isRounded={false}
                maxHeight="h-full"
                showActions={true}
                renderActions={(row) => (
                  <div className="flex gap-2 justify-center items-center">
                    <IconButton
                      onClick={() => {
                        setOnRowSelection({
                          data: row,
                          type: "store",
                        });
                      }}
                      label={"Remove"}
                      bg={"red"}
                      icon={<Trash className="w-3 h-3" />}
                    />
                  </div>
                )}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {showModals !== null && (
        <Modal
          isOpen={showModals !== null}
          onClose={() => setShowModals(null)}
          title={
            showModals === "purchaser"
              ? "Add ISR Purchaser"
              : showModals === "receiver"
                ? "Add ISR Receiver"
                : showModals === "stores"
                  ? "Add ISR Store"
                  : ""
          }
        >
          {showModals === "purchaser" && isr ? (
            <AddPurchaserISR
              data={isr}
              onClose={() => setShowModals(null)}
              mutate={isrPuMutate}
            />
          ) : showModals === "receiver" && isr ? (
            <AddReceiverISR
              data={isr}
              onClose={() => setShowModals(null)}
              mutate={isrRHMutate}
            />
          ) : showModals === "stores" && isr ? (
            <AddStoresISR
              data={isr}
              onClose={() => setShowModals(null)}
              mutate={isrSMutate}
            />
          ) : null}
        </Modal>
      )}

      {onRowSection && onRowSection.data && (
        <ConfirmationModal
          onConfirm={
            onRowSection.type === "purchaser"
              ? handleRemovePurchaser
              : onRowSection.type === "receiver"
                ? handleRemoveRequestHandler
                : onRowSection.type === "store"
                  ? handleRemovestore
                  : function (): void {
                      throw new Error("Function not implemented.");
                    }
          }
          confirmationInfo={confirmationInfo}
          onClose={function (): void {
            setOnRowSelection(null);
          }}
          title={
            onRowSection.type === "purchaser"
              ? "Remove Purchaser"
              : onRowSection.type === "receiver"
                ? "Remove Request Handler"
                : onRowSection.type === "store"
                  ? "Remove Store"
                  : ""
          }
          isLoading={isSubmitting}
          isShow={onRowSection !== null}
        />
      )}
    </div>
  );
};

export default Page;
