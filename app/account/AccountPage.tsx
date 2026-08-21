"use client";

import { Card } from "@/components/shared/CustomCard";
import PageHeader from "@/components/shared/PageHeader";
import PageLayout from "@/components/shared/PageLayout";
import { DisplayUserInfoDto } from "@/dtos/user.dto";
import { useSession } from "@/hooks/useSession";
import { fetcher } from "@/utils/fetcher";
import { KeyRound, UserRound } from "lucide-react";
import React, { useState } from "react";
import useSWR from "swr";
import ChangePasswordForm from "./components/ChangePasswordForm";
import EditInfoForm from "./components/EditInfoForm";
import ProfileSummaryCard from "./components/ProfileSummaryCard";

type AccountTab = "info" | "password";

const AccountPage = () => {
  const { user } = useSession();
  const [activeTab, setActiveTab] = useState<AccountTab>("info");

  const {
    data: userInfoResponse,
    isLoading,
    mutate,
  } = useSWR<{
    data: DisplayUserInfoDto[];
  }>(user?.userId ? `/api/users/${user.userId}` : null, fetcher);

  const userInfo = userInfoResponse?.data?.[0];

  const tabs: { key: AccountTab; label: string; icon: typeof UserRound }[] = [
    { key: "info", label: "Edit Info", icon: UserRound },
    { key: "password", label: "Change Password", icon: KeyRound },
  ];

  return (
    <PageLayout className="p-2 gap-2">
      <PageHeader title="Account" subtitle="Manage your profile and security" />

      <div className="flex w-full max-w-2xl flex-col gap-4">
        <ProfileSummaryCard user={user} userInfo={userInfo} />

        <Card>
          <div className="flex gap-1 border-b border-gray-100 px-3 pt-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-semibold transition-colors ${
                  activeTab === tab.key
                    ? "border-primary-1 text-primary-1"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-5">
            {activeTab === "info" ? (
              <EditInfoForm
                userId={user?.userId}
                userInfo={userInfo}
                isLoading={isLoading}
                onSaved={() => mutate()}
              />
            ) : (
              <ChangePasswordForm userId={user?.userId} />
            )}
          </div>
        </Card>
      </div>
    </PageLayout>
  );
};

export default AccountPage;
