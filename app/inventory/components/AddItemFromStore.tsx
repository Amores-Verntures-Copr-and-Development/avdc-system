import { Card, CardTitle } from "@/components/shared/CustomCard";
import React from "react";

const AddItemFromStore = () => {
  return (
    <div className="flex-1 h-full flex flex-col">
      <div className="flex">
        <div className="flex-[3]">
          <Card>
            <CardTitle>
              <label className="text-sm font-medium">Select store</label>
            </CardTitle>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AddItemFromStore;
