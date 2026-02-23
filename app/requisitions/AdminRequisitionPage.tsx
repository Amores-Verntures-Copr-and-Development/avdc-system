"use client";

import Button from "@/components/shared/Button";
import IconButton from "@/components/shared/IconButton";
import Modal from "@/components/shared/Modal";
import PageHeader from "@/components/shared/PageHeader";
import Table, { Column, TableHandle } from "@/components/shared/Table";
import {
  DisplayRequestItems,
  DisplayRequestOrderDto,
  RequestOrderPdf,
} from "@/dtos/request.dto";
import { useSession } from "@/hooks/useSession";
import { fetcher } from "@/utils/fetcher";
import { ArrowRight, Eye, File, FileText, Printer, Store } from "lucide-react";
import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import useSWR from "swr";
import CreatePOModal from "./components/CreatePOModal";
import { CreatePurchaseOrderFormDto } from "@/dtos/purchase.dto";
import toast from "react-hot-toast";
import { formatDateToWords } from "@/utils/formatDateToWords";
import PageLayout from "@/components/shared/PageLayout";

import ViewRequestModal from "./ViewRequestModal";
import { getRequestStatusOption } from "@/utils/requestOrderUtils";
import { formatPeso } from "@/utils/formatPeso";
import { useRouter, useSearchParams } from "next/navigation";
import { useStores } from "@/hooks/userStore";
import { Option } from "@/components/shared/DropdownSelect";
import DynamicDropdown from "@/components/shared/DynamicDropdown";
import Popup from "@/components/shared/Popup";
import { useDebounce } from "@/hooks/useDebounce";
import { PDFViewer } from "@react-pdf/renderer";
import RequestOrderPDF from "@/components/pdf/RequestOrderPDF";

const requisitionColumns: Column<DisplayRequestOrderDto>[] = [
  { name: "Order ID", key: "requestNo" },

  { name: "Requested By", key: "requestedByName" },

  { name: "Store", key: "storeName" },
  { name: "Total Items", key: "totalItems" },
  {
    name: "Total Cost",
    key: "totalCost",
    selector: (row) => (
      <span className="font-semibold">{formatPeso(row.totalCost)}</span>
    ),
  },
  {
    name: "Status",
    key: "requestStatus",
    selector: (row) => {
      const { label, bg, color, border } = getRequestStatusOption(
        row.requestStatus ?? "",
      );
      return (
        <span
          className={`${bg} ${color} ${border} text-xs rounded px-1 py-1 text-center font-semibold`}
        >
          {label}
        </span>
      );
    },
  },
  {
    name: "Date Updated",
    key: "requestUpdatedAt",
    selector: (row) => formatDateToWords(row.requestUpdatedAt),
  },
  {
    name: "Date Requested",
    key: "requestCreatedAt",
    selector: (row) => formatDateToWords(row.requestCreatedAt),
  },
];

const AdminRequisitionPage = () => {
  const tableRef = useRef<TableHandle>(null);
  const [showROPDF, setShowROPDF] = useState(false);
  const [pdfData, setPdfData] = useState<RequestOrderPdf | null>(null);
  const { user, hasStore, isAdmin } = useSession();
  const router = useRouter();
  const { stores } = useStores({ user, hasStore, isAdmin });
  const handleClear = () => {
    tableRef.current?.clearSelection();
  };
  const [selectedShowPdf, setSelectedShowPdf] =
    useState<DisplayRequestOrderDto | null>(null);
  const searchParams = useSearchParams();
  const [showCreatePO, setShowCreatePO] = useState(false);
  const [selectedtedRows, setSelectedRows] =
    useState<DisplayRequestOrderDto[]>();
  const [selectedtedRow, setSelectedRow] =
    useState<DisplayRequestOrderDto | null>();
  const url = `/api/requests/request-orders/`;

  //Check first from if the user has StockRoom if not part of the store
  //Check first if the purchase has a StockRoom
  //Display it
  const getApiUrl = useMemo(() => {
    if (!user) return null;

    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const category = searchParams.get("category") || "";
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";
    const store = searchParams.get("store") || "";
    const limit = searchParams.get("limit") || "";
    const page = searchParams.get("page") || "1";
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (from) params.append("from", from);
    if (to) params.append("to", to);
    if (status) params.append("status", status);
    if (category) params.append("category", category);
    if (store) params.append("store", store);
    if (limit) params.append("limit", limit);
    params.append("page", page);

    return `${url}?${params.toString()}`;
  }, [user, searchParams]);
  const apiDeounce = useDebounce(getApiUrl ?? "", 500);
  const {
    data: itemResponse = { data: [] },
    mutate,
    isLoading,
  } = useSWR<{
    data: DisplayRequestOrderDto[];
  }>(user ? apiDeounce : null, fetcher);

  const handleSelectionChange = (selected: DisplayRequestOrderDto[]) => {
    setSelectedRows(selected);
  };
  const { data: itemResponsePDF = { data: [] }, isLoading: loading } = useSWR<{
    data: DisplayRequestItems[];
  }>(
    selectedShowPdf
      ? `/api/requests/request-items/${selectedShowPdf?.requestId}`
      : null,
    fetcher,
  );
  const handleCreatePurchaseOrder = async (
    data: CreatePurchaseOrderFormDto,
  ) => {
    try {
      const result = await fetch(`api/purchase-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const res = await result.json();
      if (!res.success) {
        console.log("Res: ", res);
        throw new Error(res.message);
      }
      toast.success(res.message);
      mutate();
      handleClear();
      setShowCreatePO(false);
      return true;
    } catch (e: any) {
      console.log(e);
      toast.error(e.message);
      return false;
    }
  };

  useEffect(() => {
    if (!selectedShowPdf || !itemResponsePDF.data.length) return;

    const pdfData: RequestOrderPdf = {
      requestItems: itemResponsePDF.data,
      store: {
        storeName: selectedShowPdf?.storeName,
      },
      requestOrder: {
        requestId: selectedShowPdf?.requestId,
        requestNo: selectedShowPdf?.requestNo,
        requestCreatedAt: selectedShowPdf?.requestCreatedAt,
        requestStatus: selectedShowPdf?.requestStatus,
      },
      requestedBy: selectedShowPdf?.requestedByName ?? "",
    };

    setPdfData(pdfData);
    setShowROPDF(true);
  }, [selectedShowPdf, itemResponsePDF.data]);

  const handleDateRangeChange = useCallback(
    (rangeData: { from: string; to: string }) => {
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
  const storeOptions = Array.isArray(stores)
    ? stores.map((s) => ({ label: s.storeName, value: s.storeName }))
    : [];
  return (
    <PageLayout className="p-2 gap-2">
      {!selectedtedRow ? (
        <>
          <PageHeader
            title={"Requisition"}
            subtitle="Manage request orders from stores."
          />
          <div className="flex-1 min-h-0  flex flex-col">
            <Table<DisplayRequestOrderDto>
              onDateRangeChange={handleDateRangeChange}
              showDateRange
              columns={requisitionColumns}
              loading={isLoading}
              ref={tableRef}
              data={itemResponse.data}
              totalCount={10}
              onRowSelection={(row) => {
                setSelectedRow(row);
              }}
              showFilter
              filterConfig={[]}
              onSave={() => {
                console.log({});
              }}
              addContentLeftTitle={
                !["supervisor", "staff"].includes(user?.empPosition ?? "") && (
                  <div>
                    <DynamicDropdown
                      defaultValue={
                        new URL(window.location.href).searchParams.get(
                          "store",
                        ) || ""
                      }
                      options={storeOptions}
                      onChange={function (value: string | number): void {
                        if (value) {
                          const url = new URL(window.location.href);
                          url.searchParams.set("store", String(value));
                          router.push(url.toString());
                        } else {
                          const url = new URL(window.location.href);
                          url.searchParams.delete("store"); // remove 'store'
                          router.push(url.toString());
                        }
                      }}
                      placeholder={`Stores (${storeOptions.length})`}
                      icon={<Store className="w-4 h-4" />}
                      size="sm"
                    />
                  </div>
                )
              }
              showActions
              showCheckBox
              maxHeight="h-full"
              uniqueIdKey="requestId"
              onSelectionChange={handleSelectionChange}
              renderTopActions={
                selectedtedRows &&
                selectedtedRows.length > 0 && (
                  <div className="flex gap-4">
                    <div>
                      {" "}
                      <Button
                        icon={FileText}
                        label="View Request"
                        onClick={() => {
                          // setShowCreatePO(true);
                        }}
                        size="xs"
                        color="secondary"
                      />
                    </div>
                    {selectedtedRows.every(
                      (ro) => ro.requestStatus === "pending",
                    ) && (
                      <div>
                        <Button
                          icon={FileText}
                          label="Convert to PO"
                          onClick={() => {
                            setShowCreatePO(true);
                          }}
                          size="xs"
                        />
                      </div>
                    )}
                  </div>
                )
              }
              searchUrl="/requisitions"
              renderActions={(row) => (
                <div className="flex gap-2 justify-center">
                  {/* View Button */}
                  <IconButton
                    onClick={() => {
                      setSelectedRow(row);
                    }}
                    label={"View"}
                    bg={"gray"}
                    icon={<Eye size={18} />}
                  />
                  <IconButton
                    onClick={() => {
                      setSelectedShowPdf(row);
                    }}
                    label={"PDF"}
                    bg={"green"}
                    icon={<FileText size={18} />}
                  />
                  {/* <IconButton
                    onClick={() => {}}
                    label={"Convert to PO"}
                    bg={"blue"}
                    icon={<ArrowRight size={18} />}
                  /> */}
                </div>
              )}
            />
            {/* {itemResponse.data && itemResponse.data.length > 0 ? (
              
            ) : (
              <div className="flex flex-1 justify-center items-center">
                <span>
                  To view store requests, please ask admin first to assign
                  stores to your stock room.
                </span>
              </div>
            )} */}
          </div>
          <Modal
            className="bg-white h-[80%]"
            title="Create Purchase Order"
            hasPadding={false}
            isOpen={showCreatePO}
            modalDetails={
              <span className="text-xs font-semibold">
                From Requests:{" "}
                {selectedtedRows?.map((req) => req.requestNo).join(",")}
              </span>
            }
            onClose={function (): void {
              setShowCreatePO(false);
            }}
            size="xl"
          >
            <CreatePOModal
              data={selectedtedRows ?? []}
              user={user}
              onCancel={() => {
                setShowCreatePO(false);
              }}
              onSubmit={handleCreatePurchaseOrder}
            />
          </Modal>
        </>
      ) : (
        <ViewRequestModal
          selectedReq={selectedtedRow || null}
          mutateRequest={mutate}
          user={user}
          onBack={() => {
            setSelectedRow(null);
          }}
        />
      )}
      <Modal
        className="h-[95%]"
        isOpen={showROPDF}
        size="xl"
        onClose={function (): void {
          setShowROPDF(false);
          setSelectedShowPdf(null);
        }}
        isLoading={loading}
        title="Request Order PDF"
      >
        {" "}
        <PDFViewer width="100%" height="100%">
          <RequestOrderPDF data={pdfData ?? null} />
        </PDFViewer>
      </Modal>
    </PageLayout>
  );
};

export default AdminRequisitionPage;
