"use client";

import Button from "@/components/shared/Button";
import { Card, CardContent } from "@/components/shared/CustomCard";
import Input from "@/components/shared/Input";
import Modal from "@/components/shared/Modal";
import PageLayout from "@/components/shared/PageLayout";
import SectionHeader from "@/components/shared/SectionHeader";
import { ApiResponse } from "@/types/api";
import { DisplayCompanyDto } from "@/dtos/company.dto";
import { CreateUserDto, DisplayCompanyOwnerDto } from "@/dtos/user.dto";
import { useSession } from "@/hooks/useSession";
import { fetcher } from "@/utils/fetcher";
import { formatDateToWords } from "@/utils/formatDateToWords";
import {
  ArrowLeft,
  Briefcase,
  Mail,
  Phone,
  Plus,
  Save,
  Store,
  Users as UsersIcon,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import useSWR from "swr";
import AddOwnerModal from "./components/AddOwnerModal";

const statusBadge: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  suspended: "bg-amber-100 text-amber-700",
  cancelled: "bg-red-100 text-red-600",
};

const CompanyDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const { companyId } = params;
  const { user } = useSession();

  const { data: response, mutate } = useSWR<ApiResponse<DisplayCompanyDto>>(
    companyId ? `/api/companies/${companyId}` : null,
    fetcher,
  );
  const company = response?.data;

  const {
    data: ownersResponse,
    mutate: mutateOwners,
  } = useSWR<ApiResponse<DisplayCompanyOwnerDto[]>>(
    companyId ? `/api/companies/${companyId}/owners` : null,
    fetcher,
  );
  const owners = ownersResponse?.data ?? [];
  const [showAddOwner, setShowAddOwner] = useState(false);

  const [maxStores, setMaxStores] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (company) {
      setMaxStores(String(company.companyMaxStores));
    }
  }, [company?.companyMaxStores]);

  const handleSaveMaxStores = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/companies/${companyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyMaxStores: Number(maxStores) }),
      });
      const result = await res.json();
      if (!result.success) {
        throw new Error(result.message);
      }
      toast.success("Max stores updated successfully!");
      mutate();
    } catch (e: any) {
      toast.error(e.message || "Failed to update max stores.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddOwner = async (
    data: Pick<
      CreateUserDto,
      "userFname" | "userMname" | "userLname" | "userEmail" | "userName" | "userPassword"
    >,
  ): Promise<boolean> => {
    try {
      const payload: CreateUserDto = {
        ...data,
        userRole: "owner",
        userAddedBy: user?.userId ?? null,
        companyId: Number(companyId),
        empPosition: null,
        storeId: null,
      };
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!result.success) {
        throw new Error(result.message);
      }
      toast.success("Owner added successfully!");
      mutateOwners();
      mutate();
      return true;
    } catch (e: any) {
      toast.error(e.message || "Failed to add owner.");
      return false;
    }
  };

  return (
    <PageLayout className="p-2 flex flex-1 flex-col gap-2">
      <button
        onClick={() => router.push("/companies")}
        className="flex w-fit items-center gap-2 rounded-lg px-1 py-1 text-xs font-semibold hover:bg-gray-200"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>all companies</span>
      </button>

      <Card>
        <CardContent className="flex items-center gap-4 p-5">
          <div className="rounded-sm border border-primary-1/5 bg-primary-1/10 p-5">
            <Briefcase className="h-10 w-10 text-primary-1" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">{company?.companyName}</h3>
              {company && (
                <span
                  className={`inline-flex items-center justify-center rounded-full px-2 py-1 text-[10px] font-semibold capitalize ${
                    statusBadge[company.companyStatus] ?? ""
                  }`}
                >
                  {company.companyStatus}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="text-xs text-gray-500">
                  {company?.companyEmail || "-"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span className="text-xs text-gray-500">
                  {company?.companyPhone || "-"}
                </span>
              </div>
              {company?.companyCreatedAt && (
                <span className="text-xs text-gray-500">
                  Created {formatDateToWords(company.companyCreatedAt)}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <UsersIcon className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Users</p>
              <p className="text-lg font-bold text-gray-900">
                {company?.userCount ?? "-"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Store className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Stores</p>
              <p className="text-lg font-bold text-gray-900">
                {company ? `${company.storeCount} / ${company.companyMaxStores}` : "-"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 p-4">
          <SectionHeader
            icon={Store}
            title="Store Limit"
            subtitle="The maximum number of active stores this company can have."
          />
          <div className="flex max-w-xs items-end gap-3">
            <Input
              label="Max Stores"
              sizes="sm"
              type="number"
              min={0}
              value={maxStores}
              onChange={(e) => setMaxStores(e.target.value)}
            />
            <Button
              size="sm"
              icon={Save}
              label="Save"
              className="text-sm font-semibold"
              onClick={handleSaveMaxStores}
              loading={isSaving}
              disabled={!maxStores.trim()}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 p-4">
          <div className="flex items-center justify-between">
            <SectionHeader
              icon={UsersIcon}
              title="Owners"
              subtitle="Users with the Owner role for this company."
            />
            <Button
              size="sm"
              icon={Plus}
              label="Add Owner"
              className="text-sm font-semibold"
              onClick={() => setShowAddOwner(true)}
            />
          </div>

          {owners.length === 0 ? (
            <p className="text-xs text-gray-500">No owners added yet.</p>
          ) : (
            <div className="divide-y divide-gray-100 rounded-xl border border-gray-200">
              {owners.map((owner) => (
                <div
                  key={owner.userId}
                  className="flex items-center justify-between p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {owner.userFname} {owner.userLname}
                    </p>
                    <p className="text-xs text-gray-500">{owner.userEmail}</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {formatDateToWords(owner.userCreatedAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        title="Add Owner"
        isOpen={showAddOwner}
        onClose={() => setShowAddOwner(false)}
      >
        <AddOwnerModal
          onCancel={() => setShowAddOwner(false)}
          onSubmit={handleAddOwner}
        />
      </Modal>
    </PageLayout>
  );
};

export default CompanyDetailPage;
