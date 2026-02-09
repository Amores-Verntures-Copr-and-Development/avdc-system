"use client";
import Button from "@/components/shared/Button";
import Modal from "@/components/shared/Modal";
import PageHeader from "@/components/shared/PageHeader";
import PageLayout from "@/components/shared/PageLayout";
import Table, { Column } from "@/components/shared/Table";
import React, { useMemo, useState } from "react";
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
import { useRouter, useSearchParams } from "next/navigation";
import { PlusIcon, Store } from "lucide-react";

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
  const searchParams = useSearchParams();
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
  const getApiUrl = useMemo(() => {
    if (!user) return null;

    const params = new URLSearchParams();

    // List all the keys you want to read from searchParams
    const keys = [
      "search",
      "status",
      "category",
      "from",
      "to",
      "store",
      "limit",
    ];

    keys.forEach((key) => {
      const value = searchParams.get(key);
      if (value) params.append(key, value);
    });

    // Always include page, default to 1
    params.append("page", searchParams.get("page") || "1");

    return `${url}?${params.toString()}`;
  }, [user, searchParams]);
  const { data: response, isLoading } = useSWR<
    ApiResponse<DisplayCustomerDto[]>
  >(getApiUrl, fetcher);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmitAddCustomer = async (cusData: CreateCustomerDto[]) => {
    setIsSubmitting(true);
    try {
      if (cusData.length === 0) {
        toast.error("Customer is required");
        return false;
      }
      const hasSomeNoType = cusData.some(
        (c) => c.customerType === undefined || !c.customerType,
      );
      if (hasSomeNoType) {
        toast.error("Customer Type is required");
        return false;
      }
      const data = await fetch(`/api/customers/store/${user?.storeId}`, {
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
          totalCount={response?.count}
          maxHeight="h-full"
          loading={isLoading}
        />
      </div>
      <Modal
        isOpen={showAddCustomer}
        onClose={function (): void {
          setShowAddCustomer(false);
        }}
        title="Add Customer"
        size="xl"
        className="min-h-0"
      >
        <AddCustomerModal
          hasStore={hasStore}
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
