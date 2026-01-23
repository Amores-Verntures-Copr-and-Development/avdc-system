import BigCard from "@/components/shared/BigCard";
import Button from "@/components/shared/Button";
import Modal from "@/components/shared/Modal";
import {
  DisplaProductVariantsDtos,
  DisplayProductsDtos,
} from "@/dtos/products.dto";
import { formatDateToWords } from "@/utils/formatDateToWords";
import React, { useState } from "react";
import AssignComponentModal from "./AssignComponentModal";
import IconButton from "@/components/shared/IconButton";
import { Pencil, Save, X } from "lucide-react";
import Input from "@/components/shared/Input";
import { ProductVariants } from "@/types/products";
import Toggle from "@/components/shared/Toggle";

interface VariantComponentPageProps {
  data: DisplaProductVariantsDtos | null;
  showAddComponent: boolean;
  setShowAddComponent: React.Dispatch<React.SetStateAction<boolean>>;
  prod: DisplayProductsDtos | null;
}

const VariantComponentPage = ({
  data,
  showAddComponent,
  setShowAddComponent,
  prod,
}: VariantComponentPageProps) => {
  // const [showAddComponent, setShowAddComponent] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [form, setForm] = useState<ProductVariants>({
    prodId: data?.prodId ?? 0,
    prodVarCreatedAt: data?.prodVarCreatedAt ?? "",
    prodVarCreatedBy: data?.prodVarCreatedBy ?? 0,
    prodVarDeletedAt: data?.prodVarDeletedAt ?? "",
    prodVarId: data?.prodVarId ?? 0,
    prodVarName: data?.prodVarName ?? "",
    prodVarPrice: data?.prodVarPrice ?? 0,
    prodVarUpdatedAt: data?.prodVarUpdatedAt ?? "",
    prodVarUnit: data?.prodVarUnit,
    isDeductInv: Boolean(data?.isDeductInv),
  });
  return (
    <div className="flex flex-col gap-5">
      <BigCard
        title="Variant Details"
        isRounded={false}
        leftTitle={
          !isEdit ? (
            <div>
              <IconButton
                onClick={function (): void {
                  setIsEdit(true);
                }}
                label={"Edit Variant"}
                bg={"red"}
                icon={<Pencil className="w-4 h-4" />}
              />
            </div>
          ) : (
            <div className="flex gap-2">
              <div>
                <IconButton
                  onClick={function (): void {
                    setIsEdit(false);
                  }}
                  label={"Cancel"}
                  bg={"gray"}
                  icon={<X className="w-4 h-4" />}
                />
              </div>
              <div>
                <IconButton
                  onClick={function (): void {
                    throw new Error("Function not implemented.");
                  }}
                  label={"Cancel"}
                  bg={"green"}
                  icon={<Save className="w-4 h-4" />}
                />
              </div>
            </div>
          )
        }
      >
        {!isEdit ? (
          <div className="flex flex-col gap-4">
            {/* Top row: ID and Name */}
            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col">
                <span className="text-xs text-gray-400 uppercase">ID</span>
                <span className="text-sm font-semibold text-gray-800">
                  {data?.prodVarId}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-400 uppercase">Name</span>
                <span className="text-sm font-semibold text-gray-800">
                  {data?.prodVarName}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col">
                <span className="text-xs text-gray-400 uppercase">Unit</span>
                <span className="text-sm text-gray-600">
                  {data?.prodVarUnit ? data?.prodVarUnit : "-"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-400 uppercase">Price</span>
                <span className="text-sm font-semibold text-gray-800">
                  ₱{data?.prodVarPrice.toLocaleString()}
                </span>
              </div>
              {/* <div className="flex flex-col">
                <span className="text-xs text-gray-400 uppercase">
                  Is Deduct
                </span>
                <span className="text-sm text-gray-600">
                  {data?.isDeductInv === Boolean(1) ? "True" : "False"}
                </span>
              </div> */}
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col">
                <span className="text-xs text-gray-400 uppercase">
                  Is Deduct
                </span>
                <span className="text-sm text-gray-600">
                  {data?.isDeductInv === Boolean(1) ? "True" : "False"}
                </span>
              </div>
            </div>
            {/* Bottom row: Price and Created At */}
            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col">
                <span className="text-xs text-gray-400 uppercase">
                  Updated At
                </span>
                <span className="text-sm text-gray-600">
                  {formatDateToWords(data?.prodVarUpdatedAt || "")}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-400 uppercase">
                  Created At
                </span>
                <span className="text-sm text-gray-600">
                  {formatDateToWords(data?.prodVarCreatedAt || "")}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Top row: ID and Name */}
            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col">
                {/* <span className="text-xs text-gray-400 uppercase">ID</span>
                <span className="text-sm font-semibold text-gray-800">
                  {data?.prodVarId}
                </span> */}
                <Input label={"Name"} sizes={"xs"} />
              </div>
              <div className="flex flex-col">
                <Input label={"Price"} sizes={"xs"} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col">
                {/* <span className="text-xs text-gray-400 uppercase">ID</span>
                <span className="text-sm font-semibold text-gray-800">
                  {data?.prodVarId}
                </span> */}
                <Input label={"Unit"} sizes={"xs"} />
              </div>
              <div className="flex flex-col">
                <Toggle sizes="xs" label="Is Deduct?" flexType="flex-col" />
              </div>
            </div>

            {/* Bottom row: Price and Created At */}
          </div>
        )}
      </BigCard>
      <BigCard
        title={"Components"}
        isRounded={false}
        leftTitle={
          <div className="h-full">
            <Button
              label="Assign Component"
              size="sm"
              onClick={() => {
                setShowAddComponent(true);
              }}
            />
          </div>
        }
      >
        {data?.variantComponents && data?.variantComponents.length > 0 ? (
          <div className="mt-4">
            <span className="text-xs text-gray-400 uppercase">Components</span>
            <ul className="mt-2 space-y-1">
              {data.variantComponents.map((comp) => (
                <li
                  key={comp.varComId}
                  className="text-sm text-gray-700 bg-gray-50 p-2 rounded flex justify-between items-center"
                >
                  <span>{comp.inventoryItemId}</span>
                  <span className="font-semibold">{comp.quantityRequired}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="items-center text-center">
            No components available!
          </div>
        )}
      </BigCard>
      <Modal
        size="lg"
        className="h-[50%]"
        title="Assign Component"
        isOpen={showAddComponent}
        onClose={function (): void {
          setShowAddComponent(false);
        }}
      >
        <AssignComponentModal storeId={prod?.storeId ?? 0} />
      </Modal>
    </div>
  );
};

export default VariantComponentPage;
