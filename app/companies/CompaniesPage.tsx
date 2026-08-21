"use client";

import Button from "@/components/shared/Button";
import IconButton from "@/components/shared/IconButton";
import Modal from "@/components/shared/Modal";
import PageHeader from "@/components/shared/PageHeader";
import PageLayout from "@/components/shared/PageLayout";
import Table, { Column } from "@/components/shared/Table";
import { ApiResponse } from "@/types/api";
import { CreateCompanyDto, DisplayCompanyDto } from "@/dtos/company.dto";
import { fetcher } from "@/utils/fetcher";
import { formatDateToWords } from "@/utils/formatDateToWords";
import { Edit, Eye, Plus, Store, Users as UsersIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import toast from "react-hot-toast";
import useSWR from "swr";
import AddCompanyModal from "./components/AddCompanyModal";
import EditCompanyModal from "./components/EditCompanyModal";

const statusBadge: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  suspended: "bg-amber-100 text-amber-700",
  cancelled: "bg-red-100 text-red-600",
};

const companyColumns: Column<DisplayCompanyDto>[] = [
  { name: "#", key: "#", selector: (_row, index) => index + 1 },
  { name: "Company Name", key: "companyName" },
  { name: "Email", key: "companyEmail" },
  { name: "Phone", key: "companyPhone" },
  {
    name: "Users",
    key: "userCount",
    selector: (row) => (
      <span className="inline-flex items-center gap-1.5 text-gray-700">
        <UsersIcon className="h-3.5 w-3.5 text-gray-400" />
        {row.userCount}
      </span>
    ),
  },
  {
    name: "Stores",
    key: "storeCount",
    selector: (row) => (
      <span className="inline-flex items-center gap-1.5 text-gray-700">
        <Store className="h-3.5 w-3.5 text-gray-400" />
        {row.storeCount} / {row.companyMaxStores}
      </span>
    ),
  },
  {
    name: "Status",
    key: "companyStatus",
    selector: (row) => (
      <span
        className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-[10px] font-semibold capitalize ${
          statusBadge[row.companyStatus] ?? ""
        }`}
      >
        {row.companyStatus}
      </span>
    ),
  },
  {
    name: "Created",
    key: "companyCreatedAt",
    selector: (row) => formatDateToWords(row.companyCreatedAt),
  },
];

const CompaniesPage = () => {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState<DisplayCompanyDto | null>(null);

  const { data: response, mutate } = useSWR<ApiResponse<DisplayCompanyDto[]>>(
    "/api/companies",
    fetcher,
  );

  const handleSubmit = async (
    data: Omit<CreateCompanyDto, "companyCreatedBy">,
  ): Promise<boolean> => {
    try {
      const result = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const res = await result.json();
      if (!res.success) {
        throw new Error(res.message);
      }
      toast.success("Company added successfully!");
      mutate();
      return true;
    } catch (e: any) {
      toast.error(e.message || "Failed to add company.");
      return false;
    }
  };

  return (
    <PageLayout className="p-2 gap-2">
      <PageHeader
        title={"Companies"}
        subtitle="Manage the companies (workspaces) on this platform."
      />
      <div className="flex-1 min-h-0 flex flex-col justify-between">
        <Table
          showPagination
          uniqueIdKey="companyId"
          renderTopActions={
            <Button
              icon={Plus}
              label="Add Company"
              onClick={() => setShowAdd(true)}
              size="xs"
              className="font-semibold"
            />
          }
          showActions
          columns={companyColumns}
          data={response?.data ?? []}
          maxHeight="h-full"
          renderActions={(row: DisplayCompanyDto) => (
            <div className="flex justify-center gap-2">
              <IconButton
                onClick={() => router.push(`/companies/${row.companyId}`)}
                label={"View"}
                bg={"gray"}
                icon={<Eye size={18} />}
              />
              <IconButton
                onClick={() => setShowEdit(row)}
                label={"Edit"}
                bg={"gray"}
                icon={<Edit size={18} />}
              />
            </div>
          )}
        />
      </div>
      <Modal
        title="Add Company"
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
      >
        <AddCompanyModal
          onCancel={() => setShowAdd(false)}
          onSubmit={handleSubmit}
        />
      </Modal>
      <Modal
        isOpen={showEdit !== null}
        onClose={() => setShowEdit(null)}
        title={`Edit Company - ${showEdit?.companyName}`}
      >
        <EditCompanyModal
          data={showEdit}
          mutate={mutate}
          onCancel={() => setShowEdit(null)}
        />
      </Modal>
    </PageLayout>
  );
};

export default CompaniesPage;
