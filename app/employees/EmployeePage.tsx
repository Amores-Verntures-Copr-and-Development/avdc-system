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
    <PageLayout>
      <div className="flex flex-col gap-5">
        <PageHeader title={"Employee"} subtitle="Manage your employees" />
        <div className="min-h-0 flex-1">
          <Table
            showActions
            columns={employeColumn}
            data={[]}
            renderActions={(row: any) => (
              <div>
                <IconButton
                  onClick={function (): void {
                    throw new Error("Function not implemented.");
                  }}
                  label={"Edit"}
                  bg={"gray"}
                  icon={<Pencil />}
                />
              </div>
            )}
          />
        </div>
      </div>
    </PageLayout>
  );
};

export default EmployeePage;
