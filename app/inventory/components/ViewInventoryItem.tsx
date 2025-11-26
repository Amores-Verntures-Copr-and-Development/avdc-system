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
import {
  getInventoryStatus,
  getInventoryStatusInfo,
} from "@/utils/inventoryStatus";
import { Edit2, Package, X, Info, BarChart3 } from "lucide-react";
import React, { useEffect, useState } from "react";
import ItemMovementCard from "./ItemMovementCard";
import { InventoryItemInterface } from "@/types/inventory";
import { stockAdjustmentOptions } from "@/constants/dropdown-options";
import toast from "react-hot-toast";
import { ApiResponse } from "@/types/api";
import useSWR from "swr";
import { fetcher } from "@/utils/fetcher";
import { useCategories } from "@/hooks/useCategory";

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
  onClose?: () => void;
  mutate?: () => void;
  onSubmitEditItems?: (
    row: Partial<InventoryItemInterface>
  ) => Promise<boolean>;
  isEditing?: boolean;
}

const ViewInventoryItem: React.FC<ViewInventoryItemPros> = ({
  data,
  user,
  onSubmitStockAdjustment,
  isSubmittingAdjustment,
  onClose,
  mutate,
  onSubmitEditItems,
  isEditing,
}) => {
  const [inventoryItemData, setInventoryItemData] = useState(data);
  const [selectedButton, setSelectedButton] = useState<
    "details" | "stocks" | ""
  >("");
  useEffect(() => {
    setInventoryItemData(data);
  }, [data]);
  const onChange = handleChange(inventoryItemData, setInventoryItemData);

  return (
    <div className="">
      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 bg-gray-50/50">
        <button
          onClick={() => setSelectedButton("")}
          className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            selectedButton === ""
              ? "border-blue-500 text-blue-600 bg-white"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <div className="flex items-center justify-center gap-2 text-[10px] xl:text-sm">
            <Info className="w-2 h-2 xl:w-4 xl:h-4" />
            Overview
          </div>
        </button>
        <button
          onClick={() => setSelectedButton("details")}
          className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            selectedButton === "details"
              ? "border-blue-500 text-blue-600 bg-white"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <div className="flex items-center justify-center gap-2 text-[10px] xl:text-sm">
            <Edit2 className="w-2 h-2 xl:w-4 xl:h-4" />
            Edit
          </div>
        </button>
        <button
          onClick={() => setSelectedButton("stocks")}
          className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            selectedButton === "stocks"
              ? "border-blue-500 text-blue-600 bg-white"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <div className="flex items-center justify-center gap-2 text-[10px] xl:text-sm">
            <BarChart3 className="w-2 h-2 xl:w-4 xl:h-4" />
            Adjust
          </div>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 xl:p-6">
          {selectedButton === "" && <ItemInfo data={inventoryItemData} />}
          {selectedButton === "details" && (
            <EditItemDetails
              data={inventoryItemData}
              selectedButton={selectedButton}
              setSelectedButton={setSelectedButton}
              onChange={onChange}
              user={user}
              onClose={onClose}
              mutate={mutate}
              onSubmitEditItems={onSubmitEditItems}
              isEditing={isEditing}
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
              onClose={onClose}
              mutate={mutate}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewInventoryItem;

const ItemInfo: React.FC<ViewInventoryItemPros> = ({ data }) => {
  const { data: inventoryMovement } = useSWR<
    ApiResponse<DisplayInventoryMovementDto[]>
  >(
    `/api/inventory/movement/${data?.inventoryId}/${data?.inventoryItemId}`,
    fetcher
  );

  const { bgClass, status, textClass } = getInventoryStatusInfo(
    data?.inventoryItemQuantity ?? 0,
    data?.inventoryItemMin ?? 0
  );

  return (
    <div className="space-y-4 xl:space-y-6">
      {/* Basic Information Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-[10px] xl:text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Info className="w-2 h-2 xl:w-4 xl:h-4" />
          Item Information
        </h3>
        <div className="grid grid-cols-1 gap-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-[10px] xl:text-sm text-gray-600">Type</span>
            <span className="text-[10px] xl:text-sm font-medium">
              {data?.inventoryItemReferenceType}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-[10px] xl:text-sm text-gray-600">
              Category
            </span>
            <span className="text-[10px] xl:text-sm font-medium">
              {data?.categoryName}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-[10px] xl:text-sm text-gray-600">
              Available Stock
            </span>
            <span className="text-[10px] xl:text-sm font-medium">
              {data?.inventoryItemQuantity}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-[10px] xl:text-sm text-gray-600">
              Minimum Stock
            </span>
            <span className="text-[10px] xl:text-smfont-medium">
              {data?.inventoryItemMin}
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-[10px] xl:text-sm text-gray-600">Status</span>
            <span
              className={`text-[10px] xl:text-sm font-medium px-2 py-1 rounded-full ${bgClass} ${textClass} `}
            >
              {status}
            </span>
          </div>
        </div>
      </div>

      {/* Stock Movement Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-[10px] xl:text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="w-2 h-2 xl:w-4 xl:h-4" />
          Stock Movement
        </h3>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {inventoryMovement?.data && inventoryMovement.data.length > 0 ? (
            inventoryMovement.data.map((item, index) => (
              <ItemMovementCard
                key={item.invItemMovementId}
                data={item}
                index={index}
              />
            ))
          ) : (
            <div className="text-center py-8 text-gray-500 text-[10px] xl:text-sm">
              <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              No movement history
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const EditItemDetails: React.FC<
  ViewInventoryItemPros & { onClose?: () => void }
> = ({
  data,
  setSelectedButton,
  user,
  onClose,
  onSubmitEditItems,
  mutate,
  isEditing,
}) => {
  const { categoryOptions } = useCategories({
    inventoryId: data?.inventoryId ?? 0,
    reference: "inventoryId",
  });
  const [editedInventoryItem, setEditenInventryItem] = useState<
    Partial<InventoryItemInterface>
  >({
    inventoryItemMin: data?.inventoryItemMin,
    inventoryItemId: data?.inventoryItemId,
  });

  const setChange = handleChange(editedInventoryItem, setEditenInventryItem);

  const handleEditMinimumStock = async () => {
    if (onSubmitEditItems && mutate) {
      const success = await onSubmitEditItems(editedInventoryItem);
      if (success) {
        mutate();
      }
    }
    // Add your save logic here
  };

  const handleCancel = () => {
    if (setSelectedButton) {
      setSelectedButton("");
    }
  };

  return (
    <div className="space-y-4 xl:space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-[10px] xl:text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Edit2 className="w-2 h-2 xl:w-4 xl:h-4" />
          Edit Item Details
        </h3>

        <div className="space-y-4">
          {user?.empPosition === "supervisor" ? (
            <>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-[10px] xl:text-sm text-gray-600">
                  Name
                </span>
                <span className="text-[10px] xl:text-sm font-medium">
                  {data?.itemName}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-[10px] xl:text-sm text-gray-600">
                  Type
                </span>
                <span className="text-[10px] xl:text-sm font-medium">
                  {data?.inventoryItemReferenceType}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-[10px] xl:text-sm text-gray-600">
                  Category
                </span>
                <span className="text-[10px] xl:text-sm font-medium">
                  {data?.categoryName}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-[10px] xl:text-sm text-gray-600">
                  Minimum Stock
                </span>
                <div className="w-20">
                  <Input
                    value={editedInventoryItem?.inventoryItemMin ?? 0}
                    name="inventoryItemMin"
                    sizes="sm"
                    onChange={setChange}
                    type="number"
                    label={""}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm text-gray-600">Name</label>
                <Input
                  value={data?.itemName ?? ""}
                  name="itemName"
                  sizes="sm"
                  onChange={setChange}
                  label={""}
                />
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Type</span>
                <span className="text-sm font-medium">
                  {data?.inventoryItemReferenceType}
                </span>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-600">Category</label>
                {/* <DropDownSelectCategory
                  categoryType={"item"}
                  name={"categoryName"}
                  value={data?.categoryName ?? ""}
                  sizes="sm"
                  id={user?.userId}
                  referenceType={"stock-room"}
                /> */}
                {
                  <DropdownSelect
                    name={"categoryName"}
                    value={data?.categoryName}
                    options={categoryOptions ?? []}
                    onChange={setChange}
                  />
                }
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-[10px] xl:text-sm text-gray-600">
                  Minimum Stock
                </span>
                <div className="w-20">
                  <Input
                    value={editedInventoryItem?.inventoryItemMin ?? 0}
                    name="inventoryItemMin"
                    sizes="sm"
                    onChange={setChange}
                    type="number"
                    label={""}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <Button
          size="sm"
          color="nocolor"
          label="Cancel"
          onClick={handleCancel}
          className="font-medium"
        />
        <Button
          size="sm"
          label="Save Changes"
          onClick={handleEditMinimumStock}
          className="font-medium"
          loading={isEditing}
        />
      </div>
    </div>
  );
};

const StockAdjustment: React.FC<
  ViewInventoryItemPros & { onClose?: () => void }
> = ({
  data,
  setSelectedButton,
  onSubmitStockAdjustment,
  isSubmittingAdjustment,
  mutate,
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

  const setChange = handleChange(adjustmentForm, setAdjustmentForm);

  const handleSubmit = async () => {
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
      if (success && mutate) {
        if (setSelectedButton) {
          mutate();
          setSelectedButton("");
        }
      }
    }
  };

  const handleCancel = () => {
    if (setSelectedButton) {
      setSelectedButton("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-[10px] xl:text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="w-2 h-2 xl:w-4 xl:h-4" />
          Stock Adjustment
        </h3>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <span className="text-gray-600 text-[10px] xl:text-sm">
                Available Stock
              </span>
              <div className="font-semibold text-sm xl:text-lg">
                {data?.inventoryItemQuantity}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-gray-600 text-[10px] xl:text-sm">
                Minimum Stock
              </span>
              <div className="font-medium text-sm xl:text-lg">
                {data?.inventoryItemMin}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-xs xl:text-sm text-gray-600">
                Adjustment Type
              </label>
              <DropdownSelect
                name="itemMovementType"
                value={adjustmentForm?.itemMovementType}
                options={stockAdjustmentOptions}
                sizes="sm"
                onChange={setChange}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs xl:text-sm text-gray-600">
                Quantity
              </label>
              <Input
                name="itemMovementQuantity"
                value={adjustmentForm?.itemMovementQuantity ?? 0}
                sizes="sm"
                type="number"
                onChange={setChange}
                min="1"
                label={""}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs xl:text-sm text-gray-600">Reason</label>
              <Textarea
                name="itemMovementRemarks"
                value={adjustmentForm?.itemMovementRemarks}
                sizes="sm"
                onChange={setChange}
                placeholder="Enter reason for stock adjustment..."
                rows={3}
                label={""}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <Button
          size="sm"
          color="nocolor"
          label="Cancel"
          onClick={handleCancel}
          className="font-medium"
        />
        <Button
          size="sm"
          loading={isSubmittingAdjustment}
          label="Apply Adjustment"
          onClick={handleSubmit}
          className="font-medium"
        />
      </div>
    </div>
  );
};
