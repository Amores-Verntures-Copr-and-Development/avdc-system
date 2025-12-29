import BigCard from "@/components/shared/BigCard";
import Button from "@/components/shared/Button";
import Modal from "@/components/shared/Modal";
import {
  DisplaProductVariantsDtos,
  DisplayProductsDtos,
} from "@/dtos/products.dto";
import { formatDateToWords } from "@/utils/formatDateToWords";
import React from "react";
import AssignComponentModal from "./AssignComponentModal";

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
  return (
    <div className="flex flex-col gap-5">
      <BigCard title="Variant Details" isRounded={false}>
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

          {/* Bottom row: Price and Created At */}
          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col">
              <span className="text-xs text-gray-400 uppercase">Price</span>
              <span className="text-sm font-semibold text-gray-800">
                ₱{data?.prodVarPrice.toLocaleString()}
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

          {/* Optional: Variant Components */}
          {/* {data?.varianComponents && data.varianComponents.length > 0 && (
            <div className="mt-4">
              <span className="text-xs text-gray-400 uppercase">
                Components
              </span>
              <ul className="mt-2 space-y-1">
                {data.varianComponents.map((comp) => (
                  <li
                    key={comp.componentId}
                    className="text-sm text-gray-700 bg-gray-50 p-2 rounded flex justify-between items-center"
                  >
                    <span>{comp.componentName}</span>
                    <span className="font-semibold">{comp.quantity}</span>
                  </li>
                ))}
              </ul>
            </div>
          )} */}
        </div>
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
