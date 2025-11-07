"use client";

import Button from "@/components/shared/Button";
import IconButton from "@/components/shared/IconButton";
import Modal from "@/components/shared/Modal";
import PageHeader from "@/components/shared/PageHeader";
import Table, { Column } from "@/components/shared/Table";
import {
  Eye,
  Plus,
  Trash,
  ListChecks,
  CheckCircle,
  Clock,
  Trash2,
} from "lucide-react";
import React, { useState } from "react";
import CreateRequestModal from "./components/CreateRequestModal";
import Card from "@/components/shared/Card";

import {
  CreateRequestFormDto,
  CreateRequestItemDto,
  DisplayRequestOrderDto,
} from "@/dtos/request.dto";
import { fetcher } from "@/utils/fetcher";
import useSWR from "swr";
import { useSession } from "@/hooks/useSession";
import { formatDateToWords } from "@/utils/formatDateToWords";
import ViewRequestModal from "./components/ViewRequestModal";
import toast from "react-hot-toast";
import PageLayout from "@/components/shared/PageLayout";
import { getRequestStatusFormat } from "@/utils/formatRequestStatus";
const requisitionColumns: Column<DisplayRequestOrderDto>[] = [
  { name: "Order No", key: "requestNo" },
  { name: "Total Items", key: "totalItems" },
  { name: "Requested By", key: "requestedByName" },
  {
    name: "Date Created",
    key: "requestCreatedAt",
    selector: (row: DisplayRequestOrderDto) =>
      formatDateToWords(row.requestCreatedAt),
  },
  {
    name: "Date Updated",
    key: "requestUpdatedAt",
    selector: (row: DisplayRequestOrderDto) =>
      formatDateToWords(row.requestUpdatedAt),
  },
  { name: "Store", key: "storeName" },
  {
    name: "Status",
    key: "requestStatus",
    selector: (row) => {
      const { status, bgClass, textClass, borderClass } =
        getRequestStatusFormat(row.requestStatus);
      return (
        <span
          className={`${bgClass} ${textClass} ${borderClass} text-xs rounded px-1 py-1 text-center font-semibold`}
        >
          {status}
        </span>
      );
    },
  },
];

const StoreRequisitionPage = () => {
  const [selectedtedRows, setSelectedRows] =
    useState<DisplayRequestOrderDto[]>();
  const [selectedRow, setSelectedRow] = useState<DisplayRequestOrderDto | null>(
    null
  );
  const [isShowCreateRequest, setIsShowCreateRequest] = useState(false);
  const [isShowViewRequest, setIsShowViewRequest] = useState(false);
  const { user } = useSession();
  const {
    data: itemResponse = { data: [] },
    isLoading: loading,
    mutate,
  } = useSWR<{ data: DisplayRequestOrderDto[] }>(
    user ? `/api/requests/request-orders/${user.storeId}` : null,
    fetcher
  );
  const handleSelectionChange = (selected: DisplayRequestOrderDto[]) => {
    setSelectedRows(selected);
  };
  const handleEditRow = (selected: DisplayRequestOrderDto) => {
    setSelectedRow(selected);
  };

  const handleSubmitCreateRequest = async (data: CreateRequestItemDto[]) => {
    const requestFormData: CreateRequestFormDto = {
      requestById: user?.userId ?? 0,
      requestNo: "",
      items: data,
      storeId: user?.storeId ?? 0,
    };
    try {
      const result = await fetch(`api/requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestFormData),
      });
      const res = await result.json();
      if (!res.success) {
        console.log("Res: ", res);
        throw new Error(res.err);
      }
      toast.success("Request order created successfully!");
      mutate();
      return true;
    } catch (e) {
      console.log(e);
      toast.error("Failed to create request order.");
      return false;
    }
  };

  return (
    <PageLayout className="p-4">
      <PageHeader
        title={"Requisition"}
        subtitle="Manage request order from your store."
      />
      <div className="grid grid-cols-4 gap-4 mt-5">
        <Card
          title="Total Request"
          value={20}
          icon={<ListChecks className="w-6 h-6 text-indigo-500" />}
          iconBg="bg-indigo-100"
        />
        <Card
          title="Completed Request"
          value={20}
          icon={<CheckCircle className="w-6 h-6 text-green-500" />}
          iconBg="bg-green-100"
        />
        <Card
          title="Pending Request"
          value={20}
          icon={<Clock className="w-6 h-6 text-amber-500" />}
          iconBg="bg-amber-100"
        />
        <Card
          title="Deleted Request"
          value={20}
          icon={<Trash2 className="w-6 h-6 text-red-500" />}
          iconBg="bg-red-100"
        />
      </div>
      <div className="flex-1 min-h-0  flex flex-col justify-between mt-5">
        <Table
          searchUrl="/requisitions"
          columns={requisitionColumns}
          data={itemResponse.data}
          totalCount={10}
          loading={loading}
          textSize="xs"
          showActions
          maxHeight="h-full"
          rowSize="h-10"
          showCheckBox
          onSelectionChange={handleSelectionChange}
          renderTopActions={
            <>
              {selectedtedRows && selectedtedRows.length > 0 ? (
                <Button
                  size="sm"
                  icon={<Trash size={18} />}
                  onClick={function (): void {
                    throw new Error("Function not implemented.");
                  }}
                  label="Delete"
                  className="font-semibold text-xs"
                  color="danger"
                />
              ) : (
                <>
                  <Button
                    size="sm"
                    icon={<Plus size={18} />}
                    onClick={function (): void {
                      setIsShowCreateRequest(true);
                    }}
                    label="Request Stock"
                    className="font-semibold text-xs"
                  />
                </>
              )}
            </>
          }
          renderActions={(row) => (
            <div className="flex gap-2 justify-center">
              {/* Edit Button */}
              <IconButton
                onClick={() => {
                  // handleEditRow(row);
                  setIsShowViewRequest(true);
                  setSelectedRow(row);
                }}
                label={"View"}
                bg={"gray"}
                icon={<Eye size={18} />}
              />
              <IconButton
                onClick={() => {
                  handleEditRow(row);
                }}
                label={"Edit"}
                bg={"red"}
                icon={<Trash size={18} />}
              />

              {/* Delete Button */}
            </div>
          )}
        />
      </div>
      <Modal
        title="Create Request Order"
        size="xl"
        isOpen={isShowCreateRequest}
        hasPadding={false}
        onClose={() => {
          setIsShowCreateRequest(false);
        }}
      >
        <CreateRequestModal
          user={user}
          onSubmit={handleSubmitCreateRequest}
          onCancel={() => {
            setIsShowCreateRequest(false);
          }}
        />
      </Modal>
      <Modal
        hasPadding={false}
        className="bg-white h-[95%]"
        title={`Request Order (${selectedRow?.requestNo})`}
        modalDetails={(() => {
          const { status, bgClass, textClass, borderClass } =
            getRequestStatusFormat(selectedRow?.requestStatus ?? "pending");
          return (
            <div className="flex flex-1 justify-between align-middle items-center">
              <div className="flex flex-col">
                <span className="text-xs text-gray-600">
                  Store:{" "}
                  <span className="font-bold text-black">
                    {selectedRow?.storeName}
                  </span>
                </span>
                <span className="text-xs text-gray-600">
                  Requestor:{" "}
                  <span className="font-bold text-black">
                    {selectedRow?.requestedByName}
                  </span>
                </span>
              </div>
              <span className="text-xs text-gray-600">
                Status:{" "}
                <span
                  className={`${bgClass} ${textClass} ${borderClass} text-xs rounded px-1 py-1 text-center font-semibold`}
                >
                  {status}
                </span>
              </span>
            </div>
          );
        })()}
        size="xl"
        isOpen={isShowViewRequest}
        onClose={() => {
          setIsShowViewRequest(false);
        }}
      >
        <ViewRequestModal selectedReq={selectedRow} mutateRequest={mutate} />
      </Modal>
    </PageLayout>
  );
};

export default StoreRequisitionPage;
