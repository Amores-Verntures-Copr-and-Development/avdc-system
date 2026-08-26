"use client";
import IconButton from "@/components/shared/IconButton";
import PageHeader from "@/components/shared/PageHeader";
import PageLayout from "@/components/shared/PageLayout";
import Table from "@/components/shared/Table";
import { DisplayUserDto } from "@/dtos/user.dto";
import { fetcher } from "@/utils/fetcher";
import { formatDateToWords } from "@/utils/formatDateToWords";
import { Pencil } from "lucide-react";
import React from "react";
import useSWR from "swr";

const employeeColumn = [
  { name: "ID", key: "empId" },
  {
    name: "Name",
    key: "userFname",
    selector: (row: DisplayUserDto) => `${row.userFname} ${row.userLname}`,
  },
  { name: "Position", key: "empPosition" },
  {
    name: "Store",
    key: "storeEmployees",
    selector: (row: DisplayUserDto) =>
      row.storeEmployees?.map((s) => s.storeName).join(", ") || "-",
  },
  {
    name: "Created",
    key: "userCreatedAt",
    selector: (row: DisplayUserDto) => formatDateToWords(row.userCreatedAt),
  },
];

const EmployeePage = () => {
  const { data: response = { data: [] }, isLoading } = useSWR<{
    data: DisplayUserDto[];
  }>("/api/employees", fetcher);

  return (
    <PageLayout className="gap-2 p-2">
      <PageHeader title={"Employees"} subtitle="Manage your employees" />
      <div className="min-h-0 flex-1 flex flex-col">
        <Table
          loading={isLoading}
          showActions
          columns={employeeColumn}
          data={response.data}
          maxHeight="h-full"
          uniqueIdKey="empId"
          renderActions={(row: DisplayUserDto) => (
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
