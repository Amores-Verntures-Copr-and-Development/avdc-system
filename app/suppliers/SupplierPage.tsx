"use client";

import Modal from "@/components/shared/Modal";
import PageHeader from "@/components/shared/PageHeader";
import PageLayout from "@/components/shared/PageLayout";
import Table, { Column } from "@/components/shared/Table";
import { Supplier } from "@/types/supplier";
import React, { useState } from "react";
import CreateSupplierModal from "./component/CreateSupplierModal";
import Button from "@/components/shared/Button";
import {
  Eye,
  FileText,
  Locate,
  MailIcon,
  Map,
  Package,
  Phone,
  Pin,
  PinIcon,
  Printer,
  Store,
  Trash2,
} from "lucide-react";
import { CreateSupplierDto } from "@/dtos/supplier.dto";
import { useSession } from "@/hooks/useSession";
import toast from "react-hot-toast";
import { DisplayInventoryItems } from "@/dtos/inventory.dto";
import { fetcher } from "@/utils/fetcher";
import useSWR from "swr";
import { formatDateToWords } from "@/utils/formatDateToWords";
import IconButton from "@/components/shared/IconButton";
import ViewSupplierModal from "./component/ViewSupplierModal";
import Popup from "@/components/shared/Popup";

const supplierColumns: Column<Supplier>[] = [
  { name: "Supplier Code", key: "suppCode" },
  { name: "Name", key: "suppName" },
  { name: "Contact Person", key: "suppContactPerson" },
  { name: "Email", key: "suppEmail" },
  { name: "Phone", key: "suppPhone" },
  { name: "Address", key: "suppAddress" },
  {
    name: "Date Created",
    key: "suppCreatedAt",
    selector: (row: Supplier) => formatDateToWords(row.suppCreatedAt),
  },
];

const SupplierPage = () => {
  const [showCreateSupplier, setShowCreateSupplier] = useState(false);
  const [showViewSupplier, setShowViewSupplier] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier>();
  const { user } = useSession();
  const {
    data: itemResponse = { data: [] },
    isLoading: loading,
    mutate,
  } = useSWR<{ data: Supplier[] }>(`/api/suppliers/`, fetcher);
  const handleCreateSupplier = async (data: CreateSupplierDto) => {
    try {
      const newData: CreateSupplierDto = {
        ...data,
        suppCreatedBy: user?.userId ?? 0,
      };
      console.log("CreateFirstItem: ", newData);
      const result = await fetch(`api/suppliers/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newData),
      });
      const res = await result.json();
      if (!res.success) {
        console.log("Res: ", res);
        throw new Error(res.err);
      }
      toast.success(res.message);
      mutate();
      return true;
    } catch (e: any) {
      toast.error(e);
      return false;
    }
  };
  return (
    <PageLayout>
      <PageHeader title={"Supplier"} subtitle="Manage suppliers" />
      <div className="flex-1 min-h-0  flex flex-col justify-between">
        <Table
          maxHeight="h-full"
          showActions
          renderTopActions={
            <div>
              <div>
                <Button
                  icon={<Package size={17} />}
                  label="Create Supplier"
                  onClick={() => {
                    setShowCreateSupplier(true);
                  }}
                  size="sm"
                  className="font-semibold"
                  color="primary"
                />
              </div>
            </div>
          }
          columns={supplierColumns}
          data={itemResponse.data}
          totalCount={10}
          renderActions={(row) => (
            <div className="flex gap-2 justify-center">
              {/* View Button */}
              <IconButton
                onClick={() => {
                  setShowViewSupplier(true);
                  setSelectedSupplier(row);
                }}
                label={"View"}
                bg={"gray"}
                icon={<Eye size={18} />}
              />
              <IconButton
                onClick={() => {}}
                label={"Delete"}
                bg={"red"}
                icon={<Trash2 size={18} />}
              />
            </div>
          )}
        />
      </div>
      <Modal
        leadingIcon={Package}
        className="bg-white"
        title="Create Supplier"
        isOpen={showCreateSupplier}
        onClose={function (): void {
          setShowCreateSupplier(false);
        }}
        children={
          <CreateSupplierModal
            onSubmit={handleCreateSupplier}
            onCancel={function (): void {
              setShowCreateSupplier(false);
            }}
          />
        }
      />
      <Modal
        leadingIcon={Package}
        className="bg-white"
        title={selectedSupplier?.suppName}
        isOpen={showViewSupplier}
        onClose={function (): void {
          setShowViewSupplier(false);
        }}
        size="xl"
        modalDetails={
          <div className="flex flex-col space-y-1 text-gray-600 text-xs">
            <div className="flex items-center gap-2">
              <Phone size={14} className="text-gray-500" />
              <span>{selectedSupplier?.suppPhone || "No contact number"}</span>
            </div>

            <div className="flex items-center gap-2">
              <MailIcon size={14} className="text-gray-500" />
              <span>{selectedSupplier?.suppEmail || "No email"}</span>
            </div>

            <div className="flex items-center gap-2">
              <Pin size={14} className="text-gray-500" />
              <span>
                {selectedSupplier?.suppAddress || "No address provided"}
              </span>
            </div>
          </div>
        }
        children={
          <ViewSupplierModal
            // onSubmit={handleCreateSupplier}
            // onCancel={function (): void {
            //   setShowViewSupplier(false);
            // }}
            data={selectedSupplier || null}
            user={user}
          />
        }
      />
    </PageLayout>
  );
};

export default SupplierPage;
