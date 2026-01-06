"use client";
import Button from "@/components/shared/Button";
import Modal from "@/components/shared/Modal";
import PageHeader from "@/components/shared/PageHeader";
import PageLayout from "@/components/shared/PageLayout";
import Table, { Column } from "@/components/shared/Table";
import { Customer } from "@/types/customer";
import { Check, Plus, PlusIcon } from "lucide-react";
import React, { useState } from "react";
import AddCustomerModal from "./components/AddCustomerModal";
import { useSession } from "@/hooks/useSession";
import { CreateCustomerDto } from "@/dtos/customer.dto";
import toast from "react-hot-toast";
import { ApiResponse } from "@/types/api";
import { CategoryInterface } from "@/types/categories";
import { fetcher } from "@/utils/fetcher";
import useSWR from "swr";

const columns: Column<Customer>[] = [
  { key: "#", name: "#", selector: (_row, index) => index + 1 },
  { key: "customerName", name: "Name" },
  { key: "customerEmail", name: "Email" },
  { key: "customerPhone", name: "Phone" },
  { key: "customerType", name: "Type" },
  { key: "totalSpent", name: "Total Spent" },
];
const CustomerPage = () => {
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const { user } = useSession();
  const { data: response, mutate } = useSWR<ApiResponse<Customer[]>>(
    user ? `api/customers/store/${user?.storeId}` : null,
    fetcher
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmitAddCustomer = async (cusData: CreateCustomerDto) => {
    setIsSubmitting(true);
    console.log({ cusData });
    if (!cusData.customerName || cusData.customerName === "") {
      toast.error("Customer name is required");
      return false;
    }
    try {
      const data = await fetch(`/api/customers/store/${cusData.storeId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cusData),
        credentials: "include",
      });

      const res = await data.json();

      if (!res.success) {
        throw new Error(res.err);
      }
      toast.success(res.message);
      setShowAddCustomer(false);
      return true;
    } catch (e) {
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <PageLayout className="p-2 gap-2">
      <PageHeader title={"Customers"} subtitle="Manage store customers" />
      <div className="min-h-0 flex-1 flex flex-col">
        <Table
          searchUrl="/customers"
          renderTopActions={
            <div>
              <div>
                <Button
                  label="Add Customer"
                  size={"sm"}
                  icon={<PlusIcon className="w-4 h-4" />}
                  onClick={() => {
                    setShowAddCustomer(true);
                  }}
                />
              </div>
            </div>
          }
          uniqueIdKey="customerId"
          columns={columns}
          data={response?.data ?? []}
          showCheckBox
          isRounded={false}
          totalCount={10}
          maxHeight="h-full"
        />
      </div>
      <Modal
        isOpen={showAddCustomer}
        onClose={function (): void {
          setShowAddCustomer(false);
        }}
        title="Add Customer"
        size="lg"
      >
        <AddCustomerModal
          user={user}
          storeId={user?.storeId ?? 0}
          onSumit={handleSubmitAddCustomer}
          isSubmitting={isSubmitting}
        />
      </Modal>
    </PageLayout>
  );
};

export default CustomerPage;
