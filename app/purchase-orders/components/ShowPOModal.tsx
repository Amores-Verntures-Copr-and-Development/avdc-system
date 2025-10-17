import Table, { Column } from "@/components/shared/Table";
import {
  DisplayPOItemsSupplier,
  DisplayPurchaseOrderItemsDto,
  UpdatePurchaseOrdersDto,
} from "@/dtos/purchase.dto";
import { PurchaseOrders } from "@/types/purchaseOrders";
import { fetcher } from "@/utils/fetcher";
import React from "react";
import useSWR from "swr";
import PendingPOView from "./PendingPOView";
import ApprovedPOView from "./ApprovedPOView";
import toast from "react-hot-toast";
import ReceivedPOView from "./ReceivedPOView";
import CompletePOView from "./CompletePOView";
import { Request } from "@/types/request";
// import PendingPOView from "./PendingPOView";
// import ApprovedPOView from "./ApprovedPOView";
interface ShowPOModalPros {
  data: PurchaseOrders | null;
}

const ShowPOModal: React.FC<ShowPOModalPros> = ({ data }) => {
  const statusSteps = ["pending", "approved", "sent", "received", "completed"];
  const currentStepIndex = statusSteps.indexOf(data?.poStatus ?? "pending");
  const api =
    data?.poStatus === "pending"
      ? `/api/purchase-order/po-items/${data?.poId}`
      : data?.poStatus === "approved"
      ? `/api/purchase-order/po-items-supplier/${data?.poId}`
      : data?.poStatus === "sent"
      ? `/api/purchase-order/po-items-supplier/${data?.poId}`
      : data?.poStatus === "received"
      ? `/api/purchase-order/po-request-order/${data?.poNumber}`
      : `/api/purchase-order/po-items-supplier/${data?.poId}`;

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
      mutate();
      return true;
    } catch (e) {
      toast.error("Failed to add Inventory.");
      return false;
    }
  };
  const handleSendPO = async (items: DisplayPOItemsSupplier[]) => {
    console.log(
      "Items: ",
      items.flatMap((i) => i.items)
    );
    const newData: UpdatePurchaseOrdersDto = {
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
      // mutate();
      return true;
    } catch (e) {
      toast.error("Failed to send to suppliers.");
      return false;
    }
  };
  const handleReceivePO = async (items: DisplayPOItemsSupplier[]) => {
    try {
      const updatePO: UpdatePurchaseOrdersDto = {
        poId: data?.poId,
        poItems: items.flatMap((i) => i.items),
      };
      const newData = {
        controller: "received",
        data: updatePO,
      };
      console.log("NewData: ", updatePO);
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
      mutate();
      return true;
    } catch (e) {
      toast.error("Failed to add Inventory.");
      return false;
    }
  };
  const handleDeliveredRO = async (dataReq: Request[]) => {
    // console.log("Data: ", dataReq[0].requestItemsData);
    const body = {
      data: dataReq,
      controller: "delivered",
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
      mutate();
      return true;
    } catch (e) {
      toast.error("Failed to update Request.");
      return false;
    }
  };
  return (
    <div className="flex flex-col">
      {/* Stepper */}
      <div className="bg-gray-50 p-4">
        <div className="flex justify-between items-center max-w-3xl mx-auto">
          {statusSteps.map((step, index) => (
            <div key={step} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    index <= currentStepIndex
                      ? "bg-primary-1 text-white"
                      : "bg-gray-300 text-gray-600"
                  }`}
                >
                  {index + 1}
                </div>
                <span className="text-xs mt-2 capitalize">{step}</span>
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
      {data?.poStatus === "pending" ? (
        <PendingPOView
          data={itemResponse.data}
          poData={data}
          onSubmit={handleApprovedPO}
        />
      ) : data?.poStatus === "approved" ? (
        <ApprovedPOView data={itemResponse.data} onSendPO={handleSendPO} />
      ) : data?.poStatus === "sent" ? (
        <ReceivedPOView
          data={itemResponse.data}
          onReceivePO={handleReceivePO}
        />
      ) : data?.poStatus === "received" ? (
        <CompletePOView
          data={itemResponse.data}
          onMarkDelivered={handleDeliveredRO}
          // onReceivePO={handleReceivePO}
        />
      ) : (
        <CompletePOView
          data={itemResponse.data}
          onMarkDelivered={handleDeliveredRO}
          // poData={data}
          // onSubmit={handleApprovedPO}
        />
      )}
    </div>
  );
};

export default ShowPOModal;
