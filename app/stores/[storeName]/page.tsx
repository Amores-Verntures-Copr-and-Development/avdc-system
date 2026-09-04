"use client";
import Button from "@/components/shared/Button";
import { Card, CardContent, CardTitle } from "@/components/shared/CustomCard";
import Modal from "@/components/shared/Modal";

import PageLayout from "@/components/shared/PageLayout";
import SectionHeader from "@/components/shared/SectionHeader";
import Table, { Column } from "@/components/shared/Table";
import Toggle from "@/components/shared/Toggle";
import { useSession } from "@/hooks/useSession";
import { ApiResponse } from "@/types/api";
import { StoreEmployee, StoreInterface } from "@/types/stores";
import { UserRole } from "@/types/users";
import { fetcher } from "@/utils/fetcher";
import { formatDateToWords } from "@/utils/formatDateToWords";
import {
  ArrowLeft,
  Banknote,
  Calendar,
  IdCard,
  ListOrdered,
  MapPin,
  Pencil,
  Puzzle,
  ShieldCheck,
  Store,
  Tablet,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import React, { useState } from "react";
import toast from "react-hot-toast";
import useSWR from "swr";
import AddUserToStoreForm from "./components/AddUserToStoreForm";
import { IntegrationInterface } from "@/types/integrations";
import LoaderComponent from "@/components/shared/LoaderComponent";

interface StoreEmployeeDetails extends StoreEmployee {
  name: string;
  userRole: UserRole;
  userEmail: string;
}
const userColumns: Column<StoreEmployeeDetails>[] = [
  { key: "name", name: "User" },
  { key: "empPosition", name: "Position" },
  { key: "userEmail", name: "Email" },
  {
    key: "storeEmpCreatedAt",
    name: "Assigned On",
    selector: (row) => formatDateToWords(row.storeEmpCreatedAt ?? ""),
  },
  { key: "status", name: "Status" },
];

const integrations = [
  {
    key: "loyverse",
    name: "Loyverse",
    image: "/loyverse.png",
    description:
      "Connect your Loyverse POS to sync products, inventory, customers, and sales.",
  },
];

const Page = () => {
  const params = useParams();
  const [isAddUser, setIsAddUser] = useState(false);
  const { storeName } = params;
  const [showIntegration, setShowIntegration] = useState(false);
  const [updatingFeature, setUpdatingFeature] = useState<
    "kiosk" | "order" | "salesApproval" | "installment" | null
  >(null);
  const { user } = useSession();
  const { data, mutate: mutateStore } = useSWR<ApiResponse<StoreInterface[]>>(
    storeName ? `/api/stores/search?storeName=${storeName}` : null,
    fetcher,
  );

  const store = data?.data[0];
  console.log({ store });

  const canManageFeatures =
    user?.userRole === "superadmin" ||
    user?.userRole === "owner" ||
    (user?.userRole === "employee" && user?.empPosition === "admin");

  const featureFields = {
    kiosk: "storeKioskEnabled",
    order: "storeOrderEnabled",
    salesApproval: "storeSalesApprovalEnabled",
    installment: "storeInstallmentEnabled",
  } as const;

  const featureLabels = {
    kiosk: "Kiosk",
    order: "Order",
    salesApproval: "Sales Approval",
    installment: "Installment",
  } as const;

  const handleToggleFeature = async (
    feature: "kiosk" | "order" | "salesApproval" | "installment",
    enabled: boolean,
  ) => {
    if (!store?.storeId) return;

    setUpdatingFeature(feature);
    try {
      const res = await fetch(`/api/stores/${store.storeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [featureFields[feature]]: enabled }),
      });
      const result = await res.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      toast.success(
        `${featureLabels[feature]} ${enabled ? "enabled" : "disabled"} for this store.`,
      );
      mutateStore();
    } catch (e: any) {
      toast.error(e.message || "Failed to update store feature.");
    } finally {
      setUpdatingFeature(null);
    }
  };
  const {
    data: employeeData,
    isLoading: isEmpLoading,
    mutate: mutateEmp,
  } = useSWR<ApiResponse<StoreEmployeeDetails[]>>(
    store ? `/api/stores/${store.storeId}/store-employee` : null,
    fetcher,
  );
  const router = useRouter();
  const { data: resposeInteg, isLoading: isLoadInteg } = useSWR<
    ApiResponse<IntegrationInterface[]>
  >(store ? `/api/integration/${store?.storeId}` : null, fetcher);
  return (
    <PageLayout className="p-2 flex flex-1 flex-col gap-2 min-h-screen">
      <div className="flex justify-between">
        <button
          onClick={() => router.push(`/stores`)}
          className="px-1 py-1 flex gap-2 items-center font-semibold text-xs hover:bg-gray-200 rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>all stores</span>
        </button>
        <div>
          <Button icon={Pencil} label="Edit Store" size="sm" />
        </div>
      </div>
      <Card className="">
        <CardContent className="p-5 flex flex-1 items-center gap-4">
          <div className="p-5 bg-primary-1/10 border rounded-sm border-primary-1/5">
            <Store className="text-primary-1 h-10 w-10" />
          </div>

          <div className="flex flex-col justify-between gap-2">
            <div className="flex flex-col gap-1">
              <h3 className="font-semibold text-lg">{store?.storeName}</h3>
              <span className="text-xs text-gray-500 font-normal">
                {store?.storeDescription}
              </span>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-500">
                  {store?.storeLocation}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <IdCard className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-500">{store?.storeId}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-500">Created at {}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-500">
                  {store?.storeLocation}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {canManageFeatures && (
        <Card>
          <CardContent className="p-4 flex flex-col gap-4">
            <SectionHeader
              icon={Store}
              title="Store Features"
              subtitle="Enable or disable features for this store's staff."
            />
            <div className="flex flex-col divide-y divide-gray-100">
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-1/10">
                    <Tablet className="h-4 w-4 text-primary-1" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Kiosk</p>
                    <p className="text-xs text-gray-500">
                      Shows the Kiosks page in the sidebar for this store&apos;s
                      staff and supervisors.
                    </p>
                  </div>
                </div>
                <Toggle
                  initial={!!store?.storeKioskEnabled}
                  onToggle={(enabled) => handleToggleFeature("kiosk", enabled)}
                  disabled={updatingFeature === "kiosk"}
                  sizes="sm"
                />
              </div>

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-1/10">
                    <ListOrdered className="h-4 w-4 text-primary-1" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Order</p>
                    <p className="text-xs text-gray-500">
                      Shows the Orders page in the sidebar for this store&apos;s
                      staff.
                    </p>
                  </div>
                </div>
                <Toggle
                  initial={!!store?.storeOrderEnabled}
                  onToggle={(enabled) => handleToggleFeature("order", enabled)}
                  disabled={updatingFeature === "order"}
                  sizes="sm"
                />
              </div>

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-1/10">
                    <ShieldCheck className="h-4 w-4 text-primary-1" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Sales Approval
                    </p>
                    <p className="text-xs text-gray-500">
                      Requires approval sale before it&apos;s finalized for this
                      store.
                    </p>
                  </div>
                </div>
                <Toggle
                  initial={!!store?.storeSalesApprovalEnabled}
                  onToggle={(enabled) =>
                    handleToggleFeature("salesApproval", enabled)
                  }
                  disabled={updatingFeature === "salesApproval"}
                  sizes="sm"
                />
              </div>

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-1/10">
                    <Banknote className="h-4 w-4 text-primary-1" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Installment
                    </p>
                    <p className="text-xs text-gray-500">
                      {store?.companyInstallmentEnabled
                        ? "Tracks installment plans and scheduled check deposits for this store."
                        : "Ask your Super Admin to enable Installment for your company first."}
                    </p>
                  </div>
                </div>
                <Toggle
                  initial={!!store?.storeInstallmentEnabled}
                  onToggle={(enabled) =>
                    handleToggleFeature("installment", enabled)
                  }
                  disabled={
                    updatingFeature === "installment" ||
                    !store?.companyInstallmentEnabled
                  }
                  sizes="sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      <Card className="flex flex-col gap-3  min-h-0">
        <CardContent className="p-3 flex-1 flex flex-col">
          <div className="border-b-2 border-border">
            <div className="flex gap-3 p-3">
              {/* <button className="text-xs font-semibold">Overview</button> */}
              <button className="text-xs font-semibold">Users</button>
              {/* <button className="text-xs font-semibold">Stock Rooms</button> */}
            </div>
          </div>
          <div className="min-h-0">
            <div className="flex justify-between pt-4 pb-3">
              <div className="flex flex-col gap-2 ">
                <h4 className="font-semibold text-sm">Assigned Users</h4>
                <p className="text-xs font-medium text-gray-500">
                  Users who have access to this store.
                </p>
              </div>
              <div>
                <Button
                  label="Add User"
                  size="sm"
                  icon={Pencil}
                  onClick={() => setIsAddUser(true)}
                />
              </div>
            </div>
            <div className="flex flex-1 min-h-0">
              <Table
                columns={userColumns}
                data={employeeData?.data || []}
                loading={isEmpLoading}
                isRounded={false}
                maxHeight={"h-full"}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="min-h-0  space-y-2">
        <CardTitle className="p-2">
          <div className="flex justify-between">
            <div className="flex flex-col gap-1">
              <h1 className="font-medium text-sm">Integrations</h1>
              <span className="text-xs text-gray-500 font-medium">
                Manage and integrate third party.
              </span>
            </div>
            <div>
              <Button
                label="Add Integration"
                size="sm"
                color="neutral"
                icon={Puzzle}
                onClick={() => setShowIntegration(true)}
              />
            </div>
          </div>
        </CardTitle>
        <CardContent className="">
          <div className="grid grid-cols-5">
            {isLoadInteg ? (
              <LoaderComponent />
            ) : (
              resposeInteg?.data.map((i) => {
                const image =
                  i.integrationType === "loyverse" ? "/loyverse.png" : "";
                const name = i.integrationType === "loyverse" ? "Loyverse" : "";
                return (
                  <div
                    className="p-2 "
                    key={i.integId}
                    onClick={() =>
                      router.push(
                        `/stores/${encodeURIComponent(String(store?.storeName))}/integration/${i.integrationType}/${i.integId}`,
                      )
                    }
                  >
                    <div className="p-2  border-border border flex h-30 w-30 items-center justify-center overflow-hidden rounded-lg bg-gray-50">
                      {image ? (
                        <Image
                          src={image}
                          alt={name}
                          width={80}
                          height={80}
                          className="h-20 w-20 object-contain"
                        />
                      ) : (
                        <Puzzle className="h-8 w-8 text-gray-300" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
      <Modal
        title="Add User to Store"
        isOpen={isAddUser}
        onClose={() => setIsAddUser(false)}
      >
        <AddUserToStoreForm
          store={store ?? null}
          mutate={mutateEmp}
          onCancel={() => setIsAddUser(false)}
        />
      </Modal>
      <Modal
        isOpen={showIntegration}
        onClose={function (): void {
          setShowIntegration(false);
        }}
        title="Choose Integration"
        subtitle="Select the integration you want to connect with your store."
      >
        <div className="flex flex-col gap-3">
          {integrations.map((integration) => (
            <button
              key={integration.key}
              className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 text-left transition-all hover:border-pink-500 hover:shadow-md"
              onClick={() => {
                if (integration.key === "loyverse") {
                  window.location.href = `/api/loyverse/${store?.storeId}/connect`;
                }
              }}
            >
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg bg-gray-50">
                <Image
                  src={integration.image}
                  alt={integration.name}
                  width={40}
                  height={40}
                  className="h-10 w-10 object-contain"
                />
              </div>

              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  {integration.name}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {integration.description}
                </p>
              </div>

              <svg
                className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          ))}
        </div>
      </Modal>
    </PageLayout>
  );
};

export default Page;
