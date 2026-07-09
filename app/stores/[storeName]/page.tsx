"use client";
import Button from "@/components/shared/Button";
import { Card, CardContent, CardTitle } from "@/components/shared/CustomCard";
import Modal from "@/components/shared/Modal";

import PageHeader from "@/components/shared/PageHeader";
import PageLayout from "@/components/shared/PageLayout";
import Table, { Column } from "@/components/shared/Table";
import { ApiResponse } from "@/types/api";
import { StoreEmployee, StoreInterface } from "@/types/stores";
import { UserRole } from "@/types/users";
import { fetcher } from "@/utils/fetcher";
import { formatDateToWords } from "@/utils/formatDateToWords";
import {
  ArrowLeft,
  Calendar,
  IdCard,
  MapPin,
  Pencil,
  Puzzle,
  Store,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useState } from "react";
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
  const { data } = useSWR<ApiResponse<StoreInterface[]>>(
    storeName ? `/api/stores/search?storeName=${storeName}` : null,
    fetcher,
  );

  const store = data?.data[0];
  console.log({ store });
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
                      <img
                        src={image}
                        alt={name}
                        className="h-20 w-20 object-contain"
                      />
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
                <img
                  src={integration.image}
                  alt={integration.name}
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
