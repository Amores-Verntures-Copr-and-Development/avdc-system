import Button from "@/components/shared/Button";
import { DisplayInventoryItems } from "@/dtos/inventory.dto";
import React from "react";

interface ViewInventoryItemPros {
  data: DisplayInventoryItems | null;
}

const ViewInventoryItem: React.FC<ViewInventoryItemPros> = ({ data }) => {
  return (
    <div className="flex flex-col">
      <div className="flex justify-center">
        <div>
          <Button
            isRounded={false}
            size="xs"
            onClick={function (): void {
              throw new Error("Function not implemented.");
            }}
            label="Edit Details"
            color="nocolor"
          />
        </div>
        <div>
          <Button
            isRounded={false}
            size="xs"
            onClick={function (): void {
              throw new Error("Function not implemented.");
            }}
            label="Stock Adjustment"
            color="nocolor"
          />
        </div>
      </div>
    </div>
  );
};

export default ViewInventoryItem;
