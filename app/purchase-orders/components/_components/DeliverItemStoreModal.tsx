import Button from "@/components/shared/Button";
import DropDownSearchStore from "@/components/shared/DropDownSearchStore";
import Table, { Column } from "@/components/shared/Table";
import {
  DeliverItemsToStore,
  DisplayPOItemsSupplier,
} from "@/dtos/purchase.dto";
import { PurchaseOrderItems } from "@/types/purchaseOrders";
import { Request } from "@/types/request";
import { StoreInterface } from "@/types/stores";
import { fetcher } from "@/utils/fetcher";
import React, { useState } from "react";
import useSWR from "swr";

interface StoreWithRequest extends Request, StoreInterface {}

interface DeliverItemStoreModalProps {
  data: DisplayPOItemsSupplier | null;
  poId: number;
  onSubmit: (row: DeliverItemsToStore) => Promise<boolean>;
}
const storeColumn: Column<StoreWithRequest>[] = [
  { name: "#", key: "#", selector: (row, index) => index + 1 },
  { name: "Name", key: "storeName" },
  { name: "Request No", key: "requestNo" },
];
const columns: Column<PurchaseOrderItems>[] = [
  { name: "#", key: "#", selector: (_row, index) => index + 1 },
  { name: "Item Name", key: "itemName" },
];
const DeliverItemStoreModal = ({
  data,
  onSubmit,
  poId,
}: DeliverItemStoreModalProps) => {
  const [store, setStore] = useState<StoreWithRequest | null>(null);
  const {
    data: itemResponse = { data: [] },
    isLoading,
    mutate,
  } = useSWR<{ data: any }>(`api/purchase-order/${poId}/stores`, fetcher);
  const handleSubmit = async () => {
    const deliverData: DeliverItemsToStore = {
      poId:poId,
      storeId: store?.storeId ?? 0,
      items: data?.items ?? [],
      requestId: store?.requestId ?? 0,
    };
    const success = await onSubmit(deliverData);
    if (success) {
      alert("Done Diliver");
    }
  };
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm text-gray-500">
        Select store to deliver item from supplier{" "}
        <span className="font-semibold text-black">{data?.suppName}.</span>
      </span>
      <div>
        <Table
          isRounded={false}
          columns={storeColumn}
          data={itemResponse.data ?? []}
          onRowSelection={(row) => {
            setStore(row);
          }}
        />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex justify-between">
          {" "}
          <h1 className="text-sm font-semibold">Supplier: {data?.suppName}</h1>
          <h1 className="text-sm font-semibold">Store: {store?.storeName}</h1>
        </div>
        <Table isRounded={false} columns={columns} data={data?.items ?? []} />
      </div>

      {/* Buttons at bottom */}
      <div className="flex gap-2 mt-auto pt-4">
        {" "}
        {/* mt-auto pushes to bottom */}
        <Button size="xs" color="nocolor" label="Cancel" />
        <Button size="xs" label="Submit" onClick={handleSubmit} />
      </div>
    </div>
  );
};

export default DeliverItemStoreModal;
