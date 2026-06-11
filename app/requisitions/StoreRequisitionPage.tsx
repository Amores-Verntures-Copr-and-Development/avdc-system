"use client";

import Button from "@/components/shared/Button";
import IconButton from "@/components/shared/IconButton";
import Modal from "@/components/shared/Modal";
import PageHeader from "@/components/shared/PageHeader";
import Table, { Column, TableHandle } from "@/components/shared/Table";
import {
  Eye,
  Plus,
  Trash,
  ListChecks,
  CheckCircle,
  Clock,
  Trash2,
} from "lucide-react";
import React, { useRef, useState } from "react";
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

import toast from "react-hot-toast";
import PageLayout from "@/components/shared/PageLayout";
import ViewRequestModal from "./ViewRequestModal";
import { getRequestStatusOption } from "@/utils/requestOrderUtils";
import ConfirmationModal from "@/components/shared/ConfirmationModal";
const requisitionColumns: Column<DisplayRequestOrderDto>[] = [
  { name: "Order No", key: "requestNo" },
  { name: "Total Items", key: "totalItems" },
  { name: "Description", key: "requestDesc" },
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
      const { label, bg, color, border } = getRequestStatusOption(
        row.requestStatus ?? "",
      );
      return (
        <span
          className={`${bg} ${color} ${border} text-[9px] xl:text-xs rounded px-0.5 py-0.5 xl:px-1 xl:py-1 text-center font-semibold`}
        >
          {label}
        </span>
      );
    },
  },
];

const StoreRequisitionPage = () => {
  const tableRef = useRef<TableHandle>(null);
  const [selectedtedRows, setSelectedRows] =
    useState<DisplayRequestOrderDto[]>();
  const [selectedRow, setSelectedRow] = useState<DisplayRequestOrderDto | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [isShowCreateRequest, setIsShowCreateRequest] = useState(false);
  const [isShowViewRequest, setIsShowViewRequest] = useState(false);
  const [isShowDeleteRequest, setIsShowDeleteRequest] = useState(false);
  const { user } = useSession();
  const {
    data: itemResponse = { data: [] },
    isLoading: loading,
    mutate,
  } = useSWR<{ data: DisplayRequestOrderDto[] }>(
    user ? `/api/requests/request-orders/${user.storeId}` : null,
    fetcher,
  );
  const handleSelectionChange = (selected: DisplayRequestOrderDto[]) => {
    setSelectedRows(selected);
  };
  const handleEditRow = (selected: DisplayRequestOrderDto) => {
    setSelectedRow(selected);
  };
  const handleClear = () => {
    tableRef.current?.clearSelection();
  };
  const handleUpdateData = async () => {
    const updatedData = await mutate();
    // The updatedData should contain the fresh data
    const findSelectedRo = updatedData?.data.find(
      (ro) => ro.requestId === selectedRow?.requestId,
    );
    if (findSelectedRo) {
      setSelectedRow(findSelectedRo);
    }
  };
  const handleDeleteRequest = async () => {
    setIsDeleting(true);
    try {
      if (!isShowDeleteRequest) {
        toast.error("Cannot proceed this action!");
        return;
      }
      if (!selectedRow) {
        toast.error("No selected request to delete!");
      }

      const res = await fetch(`/api/requests/${selectedRow?.requestId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const result = await res.json();
      if (!result.success) {
        throw new Error(result.message);
      }
      toast.success(`Requset ${selectedRow?.requestNo} deleted successfully!`);
      mutate();
      setSelectedRow(null);
      setIsShowDeleteRequest(false);
    } catch (e) {
      toast.error("Failed to delete request!");
    } finally {
      setIsDeleting(false);
    }
  };
  // const handleSubmitCreateRequest = async (data: CreateRequestItemDto[]) => {
  //   const requestFormData: CreateRequestFormDto = {
  //     requestById: user?.userId ?? 0,
  //     requestNo: "",
  //     items: data,
  //     storeId: user?.storeId ?? 0,
  //   };
  //   try {
  //     const result = await fetch(`api/requests`, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify(requestFormData),
  //     });
  //     const res = await result.json();
  //     if (!res.success) {
  //       console.log("Res: ", res);
  //       throw new Error(res.err);
  //     }
  //     toast.success("Request order created successfully!");
  //     mutate();
  //     handleClear();
  //     return true;
  //   } catch (e) {
  //     console.log(e);
  //     toast.error("Failed to create request order.");
  //     return false;
  //   }
  // };

  return (
    <PageLayout className="p-2 gap-2 xl:gap-4">
      {selectedRow && isShowViewRequest ? (
        <ViewRequestModal
          selectedReq={selectedRow}
          mutateRequest={handleUpdateData}
          user={user}
          onBack={() => {
            (setIsShowViewRequest(false), setSelectedRow(null));
          }}
        />
      ) : (
        <>
          <PageHeader
            title={"Requisition"}
            subtitle="Manage request order from your store."
          />
          <div className="grid grid-cols-4 gap-4">
            <Card
              title="Total Request Cost"
              value={20}
              icon={
                <ListChecks className="w-3 h-3 xl:w-6 xl:h-6 text-indigo-500" />
              }
              iconBg="bg-indigo-100"
            />
            <Card
              title="Completed Request"
              value={20}
              icon={
                <CheckCircle className="w-3 h-3 xl:w-6 xl:h-6 text-green-500" />
              }
              iconBg="bg-green-100"
            />
            <Card
              title="Pending Request"
              value={20}
              icon={<Clock className="w-3 h-3 xl:w-6 xl:h-6 text-amber-500" />}
              iconBg="bg-amber-100"
            />
            <Card
              title="Deleted Request"
              value={20}
              icon={<Trash2 className="w-3 h-3 xl:w-6 xl:h-6 text-red-500" />}
              iconBg="bg-red-100"
            />
          </div>
          <div className="flex-1 min-h-0  flex flex-col justify-between">
            <Table<DisplayRequestOrderDto>
              searchUrl="/requisitions"
              columns={requisitionColumns}
              data={itemResponse.data}
              ref={tableRef}
              showPagination
              totalCount={10}
              loading={loading}
              onRowSelection={(row) => {
                setIsShowViewRequest(true);
                setSelectedRow(row);
              }}
              uniqueIdKey="requestId"
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
                      icon={Trash}
                      onClick={function (): void {
                        throw new Error("Function not implemented.");
                      }}
                      label="Delete"
                      className="font-semibold text-xs"
                      color="danger"
                    />
                  ) : (
                    <>
                      {/* <Button
                        size="sm"
                        icon={Plus}
                        onClick={function (): void {
                          setIsShowCreateRequest(true);
                        }}
                        label="Request Stock"
                        className="font-semibold text-xs"
                      /> */}
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
                    icon={<Eye className="w-3 h-3 xl:w-4 xl:h-4" />}
                  />
                  <IconButton
                    onClick={() => {
                      setSelectedRow(row);
                      setIsShowDeleteRequest(true);
                    }}
                    label={"Delete"}
                    bg={"red"}
                    icon={<Trash className="w-3 h-3 xl:w-4 xl:h-4" />}
                  />
                </div>
              )}
            />
          </div>
        </>
      )}
      <ConfirmationModal
        onConfirm={handleDeleteRequest}
        confirmationInfo={`Are you sure you want to delete request with (${selectedRow?.totalItems}) items?`}
        onClose={function (): void {
          setIsShowDeleteRequest(false);
        }}
        title={`Delete Request ${selectedRow?.requestNo}`}
        isShow={isShowDeleteRequest}
        confirmLabel="Delete Request"
        isLoading={isDeleting}
      />
    </PageLayout>
  );
};

export default StoreRequisitionPage;
