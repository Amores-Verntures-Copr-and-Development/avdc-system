import Button from "@/components/shared/Button";
import DropdownSelect from "@/components/shared/DropdownSelect";
import DropDownSelectCategory from "@/components/shared/DropDownSelectCategory";
import Input from "@/components/shared/Input";
import Textarea from "@/components/shared/TextArea";
import { DisplayInventoryItems } from "@/dtos/inventory.dto";
import { handleChange } from "@/utils/handle-change";
import { getInventoryStatus } from "@/utils/inventoryStatus";
import { Edit2, Package } from "lucide-react";
import React, { useState } from "react";

interface ViewInventoryItemPros {
  data: DisplayInventoryItems | null;
  setSelectedButton?: React.Dispatch<React.SetStateAction<any>>;
  selectedButton?: "details" | "stocks" | "";
  setInventoryData?: React.Dispatch<
    React.SetStateAction<DisplayInventoryItems>
  >;
  inventoryData?: DisplayInventoryItems | null;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const ViewInventoryItem: React.FC<ViewInventoryItemPros> = ({ data }) => {
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
        />
      )}
      {selectedButton === "stocks" && (
        <StockAdjustment
          data={inventoryItemData}
          selectedButton={selectedButton}
          setSelectedButton={setSelectedButton}
          onChange={onChange}
        />
      )}
    </div>
  );
};

export default ViewInventoryItem;

const ItemInfo: React.FC<ViewInventoryItemPros> = ({ data }) => {
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
          <label className="text-xs font-semibold"> January 20, 2025</label>
          <label className="text-xs text-gray-500">Updated:</label>
          <label className="text-xs font-semibold">January 20, 2025</label>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-sm font-semibold">Stock Movement</h1>
        <table>
          <thead>
            <tr className="text-xs text-gray-500">
              <th>#</th>
              <th>Type</th>
              <th>Quantity</th>
              <th>Date</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            <tr className="text-xs">
              <th>1</th>
              <th>IN</th>
              <th>20</th>
              <th>January 20, 2025</th>
              <th>Received from po</th>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

const EditItemDetails: React.FC<ViewInventoryItemPros> = ({
  data,
  setSelectedButton,
  onChange,
}) => {
  return (
    <div className="flex flex-col">
      <h1 className="text-sm font-semibold">Edit Item</h1>

      <div className="grid grid-cols-2 p-3 gap-2">
        <label className="text-xs text-gray-500">Name</label>

        <Input
          label={""}
          value={data?.itemName ?? ""}
          name="itemName"
          sizes="xs"
          onChange={onChange}
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
            label="Save"
            onClick={function (): void {}}
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
}) => {
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
        <label className="text-xs text-gray-500">Minumum Stocks</label>

        <Input
          label={""}
          value={data?.inventoryItemMin ?? ""}
          name="itemName"
          sizes="xs"
          onChange={onChange}
        />
        <label className="text-xs text-gray-500">Adjustment Type</label>

        <DropdownSelect name={""} value={undefined} options={[]} sizes="xs" />
        <label className="text-xs text-gray-500">Quanity</label>

        <DropdownSelect name={""} value={undefined} options={[]} sizes="xs" />
        <label className="text-xs text-gray-500">Reason</label>

        <Textarea name={""} label={""} sizes="xs" />
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
            label="Save"
            onClick={function (): void {}}
            className="font-semibold"
          />
        </div>
      </div>
    </div>
  );
};
