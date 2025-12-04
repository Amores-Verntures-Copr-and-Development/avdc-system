import Button from "@/components/shared/Button";
import Table, { Column } from "@/components/shared/Table";
import { CreatePurchaseOrderItemDto } from "@/dtos/purchase.dto";
import { DisplayRequestItems } from "@/dtos/request.dto";
import { PurchaseOrders } from "@/types/purchaseOrders";
import { fetcher } from "@/utils/fetcher";
import React from "react";
import useSWR from "swr";

interface AddItemPOModalProps {
  data: DisplayRequestItems[] | null;
  requestId: number | null;
  onSubmit: (
    data: CreatePurchaseOrderItemDto[],
    poId: number
  ) => Promise<boolean>;
  loading?: boolean;
}

const AddItemPOModal = ({
  data,
  requestId,
  onSubmit,
  loading: isLoading,
}: AddItemPOModalProps) => {
  // const [orderData, setOrderData] = useState<DisplayRequestOrderDto[] | null>(
  //   null
  // );
  const { data: itemResponse = { data: [] }, isLoading: loading } = useSWR<{
    data: PurchaseOrders[];
  }>(
    requestId
      ? `/api/purchase-order/po-request-order/requestId/${requestId}`
      : null,
    fetcher
  );
  console.log({ itemResponse });
  const poData = itemResponse.data[0];
  //get Where the requestId is belong
  const column: Column<DisplayRequestItems>[] = [
    { key: "#", name: "#", selector: (_row, index) => index + 1 },
    { key: "itemName", name: "Name" },
    {
      name: "Quantity to Order",
      key: "reqItemQuantity",
      editable: true,
      inputType: "number",
    },
  ];
  const handleAddItemPo = async (data: DisplayRequestItems[]) => {
    const poItemData: CreatePurchaseOrderItemDto[] =
      data.map((item) => ({
        itemId: item.itemId,
        poItemOrderedQty: item.reqItemQuantity,
        poItemReceivedQty: 0,
        unitPrice: 0,
        poId: poData.poId,
      })) ?? [];
    console.log({ poItemData });
    const success = await onSubmit(poItemData, poData.poId);
    if (success) {
      // onClose();
    }
  };
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {" "}
      {/* Use h-screen for full viewport height */}
      {loading ? (
        <div></div>
      ) : (
        <>
          <h1>
            Request Order associated with{" "}
            <span className="font-semibold">{poData?.poNumber}</span>
          </h1>
          <div className="flex-1 min-h-0 overflow-auto">
            <Table columns={column} data={data ?? []} />
          </div>
          <div className="flex justify-center gap-4 py-4">
            {" "}
            {/* Add some padding */}
            <div>
              <Button size="sm" label="Cancel" color="nocolor" />
            </div>
            <div>
              <Button
                size="sm"
                label="Submit"
                onClick={() => {
                  if (data) {
                    handleAddItemPo(data);
                  }
                }}
                loading={isLoading}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AddItemPOModal;
