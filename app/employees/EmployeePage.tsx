"use client";
import IconButton from "@/components/shared/IconButton";
import PageHeader from "@/components/shared/PageHeader";
import PageLayout from "@/components/shared/PageLayout";
import Table from "@/components/shared/Table";
import { Pencil } from "lucide-react";
import React from "react";
const employeColumn = [
  { name: "ID", key: "empId" },
  { name: "Name", key: "name" },
  { name: "Position", key: "postion" },
  { name: "Created", key: "created" },
  { name: "Store", key: "store" },
];
const EmployeePage = () => {
  return (
    <PageLayout className="gap-2 p-2">
      <PageHeader title={"Employee"} subtitle="Manage your employees" />
      <div className="min-h-0 flex-1 flex flex-col">
        <Table
          showActions
          columns={employeColumn}
          data={[]}
          maxHeight="h-full"
          renderActions={(row: any) => (
            <div>
              <IconButton
                onClick={function (): void {
                  console.log(row);
                }}
                label={"Edit"}
                bg={"gray"}
                icon={<Pencil />}
              />
            </div>
          )}
        />
      </div>
    </PageLayout>
  );
};

export default EmployeePage;
