import Button from "@/components/shared/Button";
import DropdownSelect from "@/components/shared/DropdownSelect";
import DropDownSelectCategory from "@/components/shared/DropDownSelectCategory";
import Input from "@/components/shared/Input";
import Textarea from "@/components/shared/TextArea";
import {
  CreateInventoryMovementDto,
  DisplayInventoryItems,
  DisplayInventoryMovementDto,
} from "@/dtos/inventory.dto";
import { UserAuth } from "@/hooks/useSession";
import { handleChange } from "@/utils/handle-change";
import { getInventoryStatus } from "@/utils/inventoryStatus";
import { Edit2, Package } from "lucide-react";
import React, { useState } from "react";
import ItemMovementCard from "./ItemMovementCard";
import { InventoryItemInterface } from "@/types/inventory";
import { stockAdjustmentOptions } from "@/constants/dropdown-options";
import toast from "react-hot-toast";
import { ApiResponse } from "@/types/api";
import useSWR from "swr";
import { fetcher } from "@/utils/fetcher";

interface ViewInventoryItemPros {
  user?: UserAuth | null;
  data: DisplayInventoryItems | null;
  setSelectedButton?: React.Dispatch<React.SetStateAction<any>>;
  selectedButton?: "details" | "stocks" | "";
  setInventoryData?: React.Dispatch<
    React.SetStateAction<DisplayInventoryItems>
  >;
  inventoryData?: DisplayInventoryItems | null;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmitStockAdjustment?: (
    row: CreateInventoryMovementDto
  ) => Promise<boolean>;
  isSubmittingAdjustment?: boolean;
}

const ViewInventoryItem: React.FC<ViewInventoryItemPros> = ({
  data,
  user,
  onSubmitStockAdjustment,
  isSubmittingAdjustment,
}) => {
  const [inventoryItemData, setInventoryItemData] = useState(data);
  const [selectedButton, setSelectedButton] = useState<
    "details" | "stocks" | ""
  >("");
  const onChange = handleChange(inventoryItemData, setInventoryItemData);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-start">
        <div>
          <Button
            className="font-semibold"
            isRounded={false}
            icon={<Edit2 size={15} />}
            size="xs"
            onClick={function (): void {
              setSelectedButton("details");
            }}
            label="Edit Details"
            color={selectedButton === "details" ? "primary" : "nocolor"}
          />
        </div>
        <div>
          <Button
            className="font-semibold"
            icon={<Package size={15} />}
            isRounded={false}
            size="xs"
            onClick={function (): void {
              setSelectedButton("stocks");
            }}
            label="Stock Adjustment"
            color={selectedButton === "stocks" ? "primary" : "nocolor"}
          />
        </div>
      </div>
      {selectedButton === "" && <ItemInfo data={inventoryItemData} />}
      {selectedButton === "details" && (
        <EditItemDetails
          data={inventoryItemData}
          selectedButton={selectedButton}
          setSelectedButton={setSelectedButton}
          onChange={onChange}
          user={user}
        />
      )}
      {selectedButton === "stocks" && (
        <StockAdjustment
          data={inventoryItemData}
          selectedButton={selectedButton}
          setSelectedButton={setSelectedButton}
          onChange={onChange}
          onSubmitStockAdjustment={onSubmitStockAdjustment}
          isSubmittingAdjustment={isSubmittingAdjustment}
        />
      )}
    </div>
  );
};

export default ViewInventoryItem;

const ItemInfo: React.FC<ViewInventoryItemPros> = ({ data }) => {
  //localhost:3010/api/inventory/movement/1/1
  const { data: inventoryMovement } = useSWR<
    ApiResponse<DisplayInventoryMovementDto[]>
  >(
    `/api/inventory/movement/${data?.inventoryId}/${data?.inventoryItemId}`,
    fetcher
  );
  console.log({ inventoryMovement });
  return (
    <div className="space-y-4">
      <div className="flex flex-col border-b border-gray-300">
        <h1 className="text-sm font-semibold">Item Info</h1>
        <div className="grid grid-cols-2 p-3 gap-2">
          <label className="text-xs text-gray-500">ID:</label>
          <label className="text-xs font-semibold">
            {data?.inventoryItemId}
          </label>
          <label className="text-xs text-gray-500">Name:</label>
          <label className="text-xs font-semibold">{data?.itemName}</label>
          <label className="text-xs text-gray-500">Type:</label>
          <label className="text-xs font-semibold">
            {data?.inventoryItemReferenceType}
          </label>
          <label className="text-xs text-gray-500">Category:</label>
          <label className="text-xs font-semibold">{data?.categoryName}</label>
          <label className="text-xs text-gray-500">Stock Availble:</label>
          <label className="text-xs font-semibold">
            {data?.inventoryItemQuantity}
          </label>
          <label className="text-xs text-gray-500">Minimum Stock:</label>
          <label className="text-xs font-semibold">
            {data?.inventoryItemMin}
          </label>
          <label className="text-xs text-gray-500">Status:</label>
          <label className="text-xs font-semibold">
            {getInventoryStatus(
              data?.inventoryItemQuantity ?? 0,
              data?.inventoryItemMin ?? 0
            )}
          </label>
          <label className="text-xs text-gray-500">Created:</label>
          <label className="text-xs font-semibold">January 20, 2025</label>
          <label className="text-xs text-gray-500">Updated:</label>
          <label className="text-xs font-semibold">January 20, 2025</label>
        </div>
      </div>
      <div className="flex flex-col gap-4 overflow-auto">
        <h1 className="text-lg font-semibold text-gray-900">Stock Movement</h1>
        <div className="overflow-hidden flex flex-col gap-2">
          {inventoryMovement?.data.length &&
          inventoryMovement?.data.length > 0 ? (
            inventoryMovement?.data.map((item, index) => (
              <ItemMovementCard
                key={item.invItemMovementId}
                data={item}
                index={index}
              />
            ))
          ) : (
            <div>No data</div>
          )}
        </div>
      </div>
    </div>
  );
};

const EditItemDetails: React.FC<ViewInventoryItemPros> = ({
  data,
  setSelectedButton,
  user,
}) => {
  const [editedInventoryItem, setEditenInventryItem] = useState<
    Partial<InventoryItemInterface>
  >({
    inventoryItemMin: data?.inventoryItemMin,
    inventoryItemId: data?.inventoryItemId,
  });
  const setChange = handleChange(editedInventoryItem, setEditenInventryItem);
  const handleEditMinimumStock = async () => {
    console.log({ editedInventoryItem });
  };
  return (
    <div className="flex flex-col">
      <h1 className="text-sm font-semibold">Edit Item</h1>

      {user?.empPosition === "supervisor" ? (
        <div className="grid grid-cols-2 p-3 gap-2">
          <label className="text-xs text-gray-500">Name</label>

          <label className="text-xs font-semibold">{data?.itemName}</label>
          <label className="text-xs text-gray-500">Type:</label>
          <label className="text-xs font-semibold">
            {data?.inventoryItemReferenceType}
          </label>
          <label className="text-xs text-gray-500">Category:</label>
          <label className="text-xs font-semibold">{data?.categoryName}</label>
          <label className="text-xs text-gray-500">Minimum Stock:</label>
          <Input
            label={""}
            value={editedInventoryItem?.inventoryItemMin ?? 0}
            name="inventoryItemMin"
            sizes="xs"
            onChange={setChange}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 p-3 gap-2">
          <label className="text-xs text-gray-500">Name</label>

          <Input
            label={""}
            value={data?.itemName ?? ""}
            name="itemName"
            sizes="xs"
            onChange={setChange}
          />
          <label className="text-xs text-gray-500">Type:</label>
          <label className="text-xs font-semibold">
            {data?.inventoryItemReferenceType}
          </label>
          <label className="text-xs text-gray-500">Category:</label>
          <DropDownSelectCategory
            categoryType={"item"}
            name={"categoryName"}
            value={data?.categoryName ?? ""}
            sizes="xs"
            referenceType={null}
          />
        </div>
      )}
      <div className="flex justify-end gap-2">
        <div>
          <Button
            size="xs"
            color="nocolor"
            label="Cancel"
            onClick={function (): void {
              if (setSelectedButton) {
                setSelectedButton("");
              }
            }}
            className="font-semibold"
          />
        </div>
        <div>
          <Button
            size="xs"
            label="Save"
            onClick={handleEditMinimumStock}
            className="font-semibold"
          />
        </div>
      </div>
    </div>
  );
};

const StockAdjustment: React.FC<ViewInventoryItemPros> = ({
  data,
  setSelectedButton,
  onChange,
  onSubmitStockAdjustment,
  isSubmittingAdjustment,
}) => {
  const [adjustmentForm, setAdjustmentForm] =
    useState<CreateInventoryMovementDto>({
      inventoryItemId: data?.inventoryItemId ?? 0,
      itemMovementRemarks: "",
      itemMovementQuantity: 0,
      itemMovementType: "in",
      inventoryId: data?.inventoryId ?? 0,
      itemMovementReferenceId: null,
      itemMovementReference: "adjustment",
    });
  const handleSubmit = async () => {
    console.log({ adjustmentForm, data });
    if (
      adjustmentForm.itemMovementType === "out" &&
      Number(adjustmentForm.itemMovementQuantity) >
        (Number(data?.inventoryItemQuantity) ?? 0)
    ) {
      toast.error("Cannot out stock greater than available stock!");
      return;
    }
    if (adjustmentForm.itemMovementQuantity === 0) {
      toast.error("Cannot input 0 quantity!");
      return;
    }
    const adjustData: CreateInventoryMovementDto = {
      inventoryItemId: data?.inventoryItemId ?? 0,
      itemMovementRemarks: adjustmentForm?.itemMovementRemarks,
      itemMovementQuantity: adjustmentForm?.itemMovementQuantity,
      itemMovementType: adjustmentForm?.itemMovementType,
      inventoryId: data?.inventoryId ?? 0,
      itemMovementReferenceId: null,
      itemMovementReference: "adjustment",
    };
    if (onSubmitStockAdjustment) {
      const success = await onSubmitStockAdjustment(adjustData);
      if (success) {
        toast.success(`Successfully adjusted ${data?.itemName} stock!`);
      }
    }
  };
  const setChange = handleChange(adjustmentForm, setAdjustmentForm);
  return (
    <div className="flex flex-col">
      <h1 className="text-sm font-semibold">Adjust Stock</h1>
      <div className="grid grid-cols-2 p-3 gap-2">
        <label className="text-xs text-gray-500">Name</label>

        <label className="text-xs font-semibold"> {data?.itemName}</label>
        <label className="text-xs text-gray-500">Type:</label>
        <label className="text-xs font-semibold">
          {data?.inventoryItemReferenceType}
        </label>
        <label className="text-xs text-gray-500">Category:</label>
        <label className="text-xs font-semibold"> {data?.categoryName}</label>
        <label className="text-xs text-gray-500">Available Stock:</label>
        <label className="text-xs font-semibold">
          {" "}
          {data?.inventoryItemQuantity}
        </label>
        <label className="text-xs text-gray-500">Minumum Stocks</label>

        <label className="text-xs font-semibold">
          {" "}
          {data?.inventoryItemMin}
        </label>
        <label className="text-xs text-gray-500">Adjustment Type</label>

        <DropdownSelect
          name={"itemMovementType"}
          value={adjustmentForm?.itemMovementType}
          options={stockAdjustmentOptions}
          sizes="xs"
          onChange={setChange}
        />
        <label className="text-xs text-gray-500">Quanity</label>
        <Input
          label={""}
          name={"itemMovementQuantity"}
          value={adjustmentForm?.itemMovementQuantity ?? 0}
          sizes="xs"
          type="number"
          onChange={setChange}
        />
        {/* <DropdownSelect name={""} value={undefined} options={[]} sizes="xs" /> */}
        <label className="text-xs text-gray-500">Reason</label>

        <Textarea
          name={"itemMovementRemarks"}
          label={""}
          value={adjustmentForm?.itemMovementRemarks}
          sizes="xs"
          onChange={setChange}
        />
      </div>
      <div className="flex justify-end gap-2">
        <div>
          <Button
            size="xs"
            color="nocolor"
            label="Cancel"
            onClick={function (): void {
              if (setSelectedButton) {
                setSelectedButton("");
              }
            }}
            className="font-semibold"
          />
        </div>
        <div>
          <Button
            size="xs"
            loading={isSubmittingAdjustment}
            label="Save"
            onClick={function (): void {
              handleSubmit();
            }}
            className="font-semibold"
          />
        </div>
      </div>
    </div>
  );
};
