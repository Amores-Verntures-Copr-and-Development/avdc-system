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
import { StoreInterface } from "@/types/stores";

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
  const [selectCus, setSelectedCus] = useState<DisplayCustomerDto | null>(null);
  const [selectedStore, setSelectedStore] = useState<number | null>(null);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const { user, hasStore, isAdmin } = useSession();
  const { stores } = useStores({ user, hasStore, isAdmin });
  const defaultStoreFromUrl = searchParams.get("store") || "";

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
  const {
    data: response,
    isLoading,
    mutate,
  } = useSWR<ApiResponse<DisplayCustomerDto[]>>(getApiUrl, fetcher);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitAddCustomerStores = async (
    dataCus: CreateCustomerDto[],
    store: StoreInterface[],
  ) => {
    try {
      if (dataCus.length === 0) {
        toast.error("Customer is required");
        return false;
      }
      const hasSomeNoType = dataCus.some(
        (c) => c.customerType === undefined || !c.customerType,
      );
      const createStoreCustomer = {
        data: dataCus,
        store: store,
      };
      if (hasSomeNoType) {
        toast.error("Customer Type is required");
        return false;
      }
      const data = await fetch(`/api/customers/multiple-store/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createStoreCustomer),
        credentials: "include",
      });
      const res = await data.json();
      if (!res.success) {
        throw new Error(res.message || "Failed to add customer.");
      }
      toast.success(res.message);
      mutate();
      setShowAddCustomer(false);
      return true;
    } catch (e: any) {
      toast.error(e.message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };
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

      if (!user?.storeId && !selectedStore) {
        throw new Error("No store ID found!");
      }

      const data = await fetch(
        `/api/customers/store/${user?.storeId || selectedStore}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(cusData),
          credentials: "include",
        },
      );
      const res = await data.json();
      if (!res.success) {
        throw new Error(res.message || "Failed to add customer.");
      }
      toast.success(res.message);
      mutate();
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
        id: s.storeId,
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
              <div className="min-w-30 2xl:min-w-50">
                <DynamicDropdown
                  defaultValue={defaultStoreFromUrl}
                  options={storeOptions}
                  onChange={function (value: string | number): void {
                    if (value) {
                      const url = new URL(window.location.href);
                      url.searchParams.set("store", String(value));
                      const findId = storeOptions.find(
                        (s) => s.value === value,
                      )?.id;
                      setSelectedStore(Number(findId));
                      router.push(url.toString());
                    } else {
                      const url = new URL(window.location.href);
                      url.searchParams.delete("store"); // remove 'store'
                      setSelectedStore(null);
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
          showPagination
          totalCount={response?.count}
          maxHeight="h-full"
          loading={isLoading}
          onRowSelection={(row) => router.push(`/customers/${row.customerId}`)}
        />
      </div>
      <Modal
        isOpen={showAddCustomer}
        onClose={function (): void {
          setShowAddCustomer(false);
        }}
        title={`Add ${storeOptions.find((s) => selectedStore === s.id)?.value ?? ""} Customer`}
        className="max-h-[90%]"
        size="lg"
      >
        <AddCustomerModal
          hasStore={hasStore}
          user={user}
          storeId={user?.storeId ?? Number(selectedStore)}
          onSumit={handleSubmitAddCustomer}
          isSubmitting={isSubmitting}
          onClose={function (): void {
            setShowAddCustomer(false);
          }}
          stores={Array.isArray(stores) ? stores : stores}
          onSubmitCustomerStores={handleSubmitAddCustomerStores}
          storeName={
            storeOptions.find((s) => selectedStore === s.id)?.value ?? null
          }
        />
      </Modal>
    </PageLayout>
  );
};

export default CustomerPage;
