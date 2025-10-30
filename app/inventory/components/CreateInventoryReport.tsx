import Table from "@/components/shared/Table";
import React from "react";

const columns = [
  { name: "#", key: "#" },
  { name: "Name", key: "Name" },
  { name: "Unit", key: "Unit" },
  { name: "Category", key: "Category" },
  { name: "In", key: "In" },
  { name: "Out", key: "Out" },
  { name: "Current Stock", key: "Current Stock" },
];

const CreateInventoryReport = () => {
  return (
    <div className="flex flex-col">
      <div className="flex flex-col">
        <h1 className="text-sm font-semibold"> Inventory Report Details</h1>
      </div>
      <div className="min-h-0">
        {" "}
        <Table
          isRounded={false}
          columns={columns}
          data={[]}
          maxHeight="h-full"
        />
      </div>
    </div>
  );
};

export default CreateInventoryReport;
