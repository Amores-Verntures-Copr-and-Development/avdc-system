"use client";

import { useSession } from "@/hooks/useSession";
import { sideMenu } from "@/lib/sideMenu";
import { fetcher } from "@/utils/fetcher";
import { ShieldAlert } from "lucide-react";
import { usePathname } from "next/navigation";
import React from "react";
import useSWR from "swr";
import LoaderComponent from "./LoaderComponent";
import PageLayout from "./PageLayout";

const allSections = sideMenu.flatMap((group) => group.sections);

interface RequireRoleProps {
  children: React.ReactNode;
}

// Gates page access using the exact same roles/alsoShowIf rules the Sidebar
// nav is built from (see lib/sideMenu.ts) - so a page can never be reachable
// by direct URL for a role that isn't even shown the link for it.
const RequireRole = ({ children }: RequireRoleProps) => {
  const pathname = usePathname();
  const { user, loading } = useSession();

  const { data: stockRoomRes } = useSWR<{ data: { srUserId: number }[] }>(
    user?.userId ? `/api/stock-room/userId/${user.userId}/user` : null,
    fetcher,
  );
  const { data: storeEmployeeRes } = useSWR<{ data: { storeId: number }[] }>(
    user?.userId ? `/api/stores/userId/${user.userId}/store-employee` : null,
    fetcher,
  );

  const hasStockRoom = (stockRoomRes?.data?.length ?? 0) > 0;
  const hasStore = (storeEmployeeRes?.data?.length ?? 0) > 0;

  if (loading) {
    return (
      <PageLayout className="gap-4 p-2">
        <LoaderComponent />
      </PageLayout>
    );
  }

  const matchedSection = allSections.find((s) => pathname.startsWith(s.href));

  const role = user?.userRole ?? "";
  const position = user?.empPosition ?? "";
  const roleOrPosition = user?.userRole !== "employee" ? role : position;

  const assignmentFlags: Record<string, boolean> = {
    hasStockRoom,
    hasStore,
  };

  const roleMatch = !matchedSection?.roles
    ? true
    : matchedSection.roles.includes(roleOrPosition);

  const assignmentMatch = matchedSection?.alsoShowIf
    ? assignmentFlags[matchedSection.alsoShowIf]
    : false;

  const isAllowed = !matchedSection || roleMatch || assignmentMatch;

  if (!isAllowed) {
    return (
      <PageLayout className="gap-4 p-2">
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50">
            <ShieldAlert className="h-7 w-7 text-rose-500" />
          </div>
          <h1 className="text-base font-semibold text-gray-900">
            Access Denied
          </h1>
          <p className="max-w-sm text-sm text-gray-500">
            You don&apos;t have permission to view this page.
          </p>
        </div>
      </PageLayout>
    );
  }

  return <>{children}</>;
};

export default RequireRole;
