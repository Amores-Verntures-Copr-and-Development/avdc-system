"use client";
import Button from "@/components/shared/Button";
import Modal from "@/components/shared/Modal";
import PageHeader from "@/components/shared/PageHeader";
import PageLayout from "@/components/shared/PageLayout";
import Table, { Column } from "@/components/shared/Table";
import { Import, PlusIcon, Store } from "lucide-react";
import React, { useState } from "react";
import AddCustomerModal from "./components/AddCustomerModal";
import { useSession } from "@/hooks/useSession";
import { CreateCustomerDto, DisplayCustomerDto } from "@/dtos/customer.dto";
import toast from "react-hot-toast";
import { ApiResponse } from "@/types/api";

import { fetcher } from "@/utils/fetcher";
import useSWR from "swr";
import { formatPeso } from "@/utils/formatPeso";

import { formatDateToWords } from "@/utils/formatDateToWords";
import { useStores } from "@/hooks/userStore";
import DynamicDropdown from "@/components/shared/DynamicDropdown";
import { useRouter } from "next/navigation";

const columns: Column<DisplayCustomerDto>[] = [
  { key: "#", name: "#", selector: (_row, index) => index + 1 },
  { key: "customerName", name: "Name" },
  { key: "customerEmail", name: "Email" },
  { key: "customerPhone", name: "Phone" },
  { key: "customerType", name: "Type" },
  {
    key: "totalSpent",
    name: "Total Spent",
    selector: (row) => (
      <span className="font-semibold">{formatPeso(row.totalSpent)}</span>
    ),
  },
  {
    key: "lastVisit",
    name: "Last Visit",
    selector: (row) => formatDateToWords(row.lastVisit),
  },
  {
    key: "firstVisit",
    name: "First Visit",
    selector: (row) => formatDateToWords(row.firstVisit),
  },
];
const adminColumns: Column<DisplayCustomerDto>[] = [
  { key: "#", name: "#", selector: (_row, index) => index + 1 },
  { key: "customerName", name: "Name" },
  { key: "customerEmail", name: "Email" },
  { key: "customerPhone", name: "Phone" },
  { key: "storeName", name: "Store" },
  { key: "customerType", name: "Type" },
  {
    key: "totalSpent",
    name: "Total Spent",
    selector: (row) => (
      <span className="font-semibold">{formatPeso(row.totalSpent)}</span>
    ),
  },
  {
    key: "lastVisit",
    name: "Last Visit",
    selector: (row) => formatDateToWords(row.lastVisit),
  },
  {
    key: "firstVisit",
    name: "First Visit",
    selector: (row) => formatDateToWords(row.firstVisit),
  },
];
const CustomerPage = () => {
  const router = useRouter();
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const { user, hasStore, isAdmin } = useSession();
  const { stores } = useStores({ user, hasStore, isAdmin });
  const url =
    user && hasStore
      ? `api/customers/store/${user?.storeId}`
      : user
        ? `api/customers/`
        : null;
  const { data: response } = useSWR<ApiResponse<DisplayCustomerDto[]>>(
    url,
    fetcher,
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
        throw new Error(res.message || "Failed to add customer.");
      }
      toast.success(res.message);
      setShowAddCustomer(false);
      return true;
    } catch (e: any) {
      toast.error(e.message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };
  const storeOptions = Array.isArray(stores)
    ? stores.map((s) => ({
        label: s.storeName,
        value: s.storeName,
      }))
    : [];
  return (
    <PageLayout className="p-2 gap-2">
      <PageHeader title={"Customers"} subtitle="Manage store customers" />
      <div className="min-h-0 flex-1 flex flex-col">
        <Table
          searchUrl="/customers"
          renderTopActions={
            <div className="flex gap-2">
              <div>
                <Button
                  label="Import"
                  size={"sm"}
                  icon={Import}
                  onClick={() => {
                    setShowAddCustomer(true);
                  }}
                  color="outline"
                />
              </div>
              <div>
                <Button
                  label="Add Customer"
                  size={"sm"}
                  icon={PlusIcon}
                  onClick={() => {
                    setShowAddCustomer(true);
                  }}
                />
              </div>
            </div>
          }
          addContentLeftTitle={
            !hasStore && (
              <div>
                <DynamicDropdown
                  options={storeOptions}
                  onChange={function (value: string | number): void {
                    if (value) {
                      const url = new URL(window.location.href);
                      url.searchParams.set("store", String(value));
                      router.push(url.toString());
                    } else {
                      const url = new URL(window.location.href);
                      url.searchParams.delete("store"); // remove 'store'
                      router.push(url.toString());
                    }
                  }}
                  placeholder={`Stores (${storeOptions.length})`}
                  icon={<Store />}
                  size="xs"
                />
              </div>
            )
          }
          uniqueIdKey="customerId"
          columns={hasStore ? columns : adminColumns}
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
          onClose={function (): void {
            setShowAddCustomer(false);
          }}
        />
      </Modal>
    </PageLayout>
  );
};

export default CustomerPage;
