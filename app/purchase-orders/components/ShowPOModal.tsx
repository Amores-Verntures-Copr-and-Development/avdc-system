import {
  DisplayPOItemsSupplier,
  UpdatePurchaseOrdersDto,
} from "@/dtos/purchase.dto";
import { PurchaseOrderItems, PurchaseOrders } from "@/types/purchaseOrders";
import { fetcher } from "@/utils/fetcher";
import React, { useState } from "react";
import useSWR from "swr";
import PendingPOView from "./PendingPOView";
import ApprovedPOView from "./ApprovedPOView";
import toast from "react-hot-toast";
import ReceivedPOView from "./ReceivedPOView";
import CompletePOView from "./CompletePOView";
import { Request } from "@/types/request";

import { UserAuth } from "@/hooks/useSession";
import ShowAllIItems from "./ShowAllIItems";
import ShowPOByRequest from "./ShowPOByRequest";
import PageHeader from "@/components/shared/PageHeader";
import Button from "@/components/shared/Button";
import { ArrowLeft } from "lucide-react";
// import PendingPOView from "./PendingPOView";
// import ApprovedPOView from "./ApprovedPOView";
interface ShowPOModalPros {
  data: PurchaseOrders | null;
  mutate: () => void;
  onClose: () => void;
  user: UserAuth | null;
}

const ShowPOModal: React.FC<ShowPOModalPros> = ({
  data,
  mutate: mutateInventory,
  onClose,
  user,
}) => {
  const statusSteps = ["pending", "approved", "sent", "received", "completed"];
  const currentStepIndex = statusSteps.indexOf(data?.poStatus ?? "pending");
  const [showPage, setShowPage] = useState<"status" | "all" | "request">(
    "status"
  );
  const api =
    data?.poStatus === "pending"
      ? `/api/purchase-order/po-items/${data?.poId}`
      : data?.poStatus === "approved"
      ? `/api/purchase-order/po-items-supplier/${data?.poId}`
      : data?.poStatus === "sent"
      ? `/api/purchase-order/po-items-supplier/${data?.poId}`
      : data?.poStatus === "received"
      ? `/api/purchase-order/po-request-order/${data?.poNumber}`
      : `/api/purchase-order/po-request-order/${data?.poNumber}`;

  const {
    data: itemResponse = { data: [] },
    isLoading,
    mutate,
  } = useSWR<{ data: any }>(api, fetcher);
  const handleApprovedPO = async (data: UpdatePurchaseOrdersDto) => {
    const apiBody = {
      controller: "approved",
      data: data,
    };

    try {
      const result = await fetch(`api/purchase-order`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiBody),
      });
      const res = await result.json();
      if (!res.success) {
        console.log("Res: ", res);
        throw new Error(res.err);
      }
      toast.success(res.message);
      mutateInventory();
      mutate();
      return true;
    } catch (e) {
      console.log(e);
      toast.error("Failed to add Inventory.");
      return false;
    }
  };
  const handleSendPOItem = async (items: PurchaseOrderItems[]) => {
    try {
      const apiBody = {
        controller: "sent",
        data: items,
      };
      const result = await fetch(`/api/purchase-order/po-items/${data?.poId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiBody),
      });
      const res = await result.json();
      if (!res.success) {
        console.log("Res: ", res);
        throw new Error(res.err);
      }
      mutateInventory();
      mutate();
      return true;
    } catch (e) {
      console.log(e);
      toast.error("Failed to send to suppliers.");
      return false;
    }
  };
  const handleSendPO = async (items: DisplayPOItemsSupplier[]) => {
    console.log(
      "Items: ",
      items.flatMap((i) => i.items)
    );
    const newData: UpdatePurchaseOrdersDto = {
      updatedBy: user?.userId ?? 0,
      poId: data?.poId,
      poItems: items.flatMap((i) => i.items),
    };
    const apiBody = {
      controller: "sent",
      data: newData,
    };
    try {
      const result = await fetch(`/api/purchase-order/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiBody),
      });
      const res = await result.json();
      if (!res.success) {
        console.log("Res: ", res);
        throw new Error(res.err);
      }
      toast.success(res.message);
      mutateInventory();
      mutate();
      return true;
    } catch (e) {
      console.log(e);
      toast.error("Failed to send to suppliers.");
      return false;
    }
  };
  const handleReceivePO = async (items: DisplayPOItemsSupplier[]) => {
    try {
      const updatePO: UpdatePurchaseOrdersDto = {
        updatedBy: user?.userId ?? 0,
        poId: data?.poId,
        poItems: items.flatMap((i) => i.items),
      };
      const newData = {
        controller: "received",
        data: updatePO,
      };
      console.log("NewData: ", newData);
      const result = await fetch(`/api/purchase-order/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newData),
      });
      const res = await result.json();
      if (!res.success) {
        console.log("Res: ", res);
        throw new Error(res.err);
      }
      toast.success(
        `PO Items from ${items[0].suppName} received successfully!`
      );
      mutateInventory();
      mutate();
      return true;
    } catch (e) {
      console.log(e);
      toast.error("Failed to add Inventory.");
      return false;
    }
  };
  const handleDeliveredRO = async (dataReq: Request[]) => {
    // console.log("Data: ", dataReq[0].requestItemsData);
    const body = {
      data: dataReq,
      controller: "delivered",
      userId: user?.userId,
    };
    try {
      const result = await fetch(`api/requests/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const res = await result.json();
      if (!res.success) {
        console.log("Res: ", res);
        throw new Error(res.err);
      }
      toast.success(res.message);
      mutateInventory();
      mutate();
      return true;
    } catch (e) {
      console.log(e);
      toast.error("Failed to update Request.");
      return false;
    }
  };
  const handleCompleteRO = async (data: PurchaseOrders) => {
    // console.log("Data: ", dataReq[0].requestItemsData);
    const body = {
      data: data,
      controller: "completed",
    };
    try {
      const result = await fetch(`api/purchase-order/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const res = await result.json();
      if (!res.success) {
        console.log("Res: ", res);
        throw new Error(res.err);
      }
      toast.success(res.message);
      mutateInventory();
      mutate();
      return true;
    } catch (e) {
      console.log(e);
      toast.error("Failed to update Request.");
      return false;
    }
  };
  const handleUpdateData = async () => {
    mutateInventory();
    mutate();
  };
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center">
        <PageHeader title={`${data?.poNumber}`} subtitle={"Purchase Order"} />
        <div>
          <Button
            size="sm"
            onClick={onClose}
            label="Back"
            icon={<ArrowLeft className="w-4 h-4" />}
            color="neutral"
            isRounded={false}
          />
        </div>
      </div>
      <div className="bg-gray-50 p-2">
        <div className="flex justify-between items-center max-w-3xl mx-auto">
          {statusSteps.map((step, index) => (
            <div key={step} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-4 h-4 xl:w-7 xl:h-7 rounded-full flex items-center justify-center font-semibold text-xs xl:text-sm ${
                    index <= currentStepIndex
                      ? "bg-primary-1 text-white"
                      : "bg-gray-300 text-gray-600"
                  }`}
                >
                  {index + 1}
                </div>
                <span className="text-[9px] xl:text-xs mt-2 capitalize">
                  {step}
                </span>
              </div>
              {index < statusSteps.length - 1 && (
                <div
                  className={`flex-1 h-1 ${
                    index < currentStepIndex ? "bg-primary-1" : "bg-gray-300"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>
      {/* <PendingPOView data={itemResponse.data} /> */}
      {/* Step instruction */}
      {showPage === "status" ? (
        data?.poStatus === "pending" ? (
          <PendingPOView
            setShowAllItems={setShowPage}
            onClose={onClose}
            data={itemResponse.data}
            poData={data}
            onSubmit={handleApprovedPO}
            isLoading={isLoading}
            mutate={mutate}
            user={user}
          />
        ) : data?.poStatus === "approved" ? (
          <ApprovedPOView
            setShowAllItems={setShowPage}
            mutate={handleUpdateData}
            onClose={onClose}
            poData={data}
            data={itemResponse.data}
            onSendPO={handleSendPO}
            onSendPOItem={handleSendPOItem}
            loading={isLoading}
          />
        ) : data?.poStatus === "sent" ? (
          <ReceivedPOView
            mutateInventory={() => {
              mutate();
              mutateInventory();
            }}
            setShowAllItems={setShowPage}
            onClose={onClose}
            poData={data}
            data={itemResponse.data}
            onReceivePO={handleReceivePO}
            isLoading={isLoading}
            poId={data.poId}
          />
        ) : data?.poStatus === "received" ? (
          <CompletePOView
            setShowAllItems={setShowPage}
            mutate={mutateInventory}
            poData={data}
            data={itemResponse.data}
            onMarkDelivered={handleDeliveredRO}
            onCompleteRequest={handleCompleteRO}
            isLoading={isLoading}
            onClose={onClose}
            // onReceivePO={handleReceivePO}
          />
        ) : (
          <CompletePOView
            setShowAllItems={setShowPage}
            mutate={mutateInventory}
            poData={data}
            onClose={onClose}
            onCompleteRequest={handleCompleteRO}
            data={itemResponse.data}
            onMarkDelivered={handleDeliveredRO}
            isLoading={isLoading}
            // poData={data}
            // onSubmit={handleApprovedPO}
          />
        )
      ) : showPage === "all" ? (
        <ShowAllIItems
          setShowAllItems={setShowPage}
          data={data}
          onSubmit={handleApprovedPO}
          onClose={onClose}
          mutate={mutate}
          user={user}
        />
      ) : (
        <ShowPOByRequest setShowAllItems={setShowPage} data={data} />
      )}
    </div>
  );
};

export default ShowPOModal;
