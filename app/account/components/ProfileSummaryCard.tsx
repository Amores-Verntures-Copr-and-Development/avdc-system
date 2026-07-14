import BigCard from "@/components/shared/BigCard";
import { UserAuth } from "@/hooks/useSession";
import { DisplayUserInfoDto } from "@/dtos/user.dto";
import { Mail, ShieldCheck, Store } from "lucide-react";
import React from "react";

interface ProfileSummaryCardProps {
  user: UserAuth | null;
  userInfo?: DisplayUserInfoDto | null;
}

const roleLabel: Record<string, string> = {
  superadmin: "Super Admin",
  owner: "Owner",
  employee: "Employee",
};

const positionLabel: Record<string, string> = {
  purchaser: "Purchaser",
  supervisor: "Supervisor",
  accounting: "Accounting",
  hr: "HR",
  staff: "Staff",
  admin: "Admin",
};

const ProfileSummaryCard = ({ user, userInfo }: ProfileSummaryCardProps) => {
  const fullName =
    [userInfo?.userFname, userInfo?.userMname, userInfo?.userLname]
      .filter(Boolean)
      .join(" ") ||
    user?.userFullName ||
    "";

  const initials =
    fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase())
      .join("") || "?";

  return (
    <BigCard title="Profile" isRounded>
      <div className="flex flex-col items-center gap-3 py-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary-1 to-primary-1/60 text-xl font-bold text-white shadow-md">
          {initials}
        </div>

        <div className="text-center">
          <h2 className="text-sm font-semibold text-gray-900">{fullName}</h2>
          {userInfo?.userEmail && (
            <p className="mt-0.5 flex items-center justify-center gap-1 text-xs text-gray-500">
              <Mail className="h-3 w-3" />
              {userInfo.userEmail}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {user?.userRole && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-1/10 px-2.5 py-1 text-[10px] font-semibold text-primary-1">
              <ShieldCheck className="h-3 w-3" />
              {roleLabel[user.userRole] ?? user.userRole}
            </span>
          )}

          {user?.empPosition && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold text-gray-600">
              {positionLabel[user.empPosition] ?? user.empPosition}
            </span>
          )}
        </div>

        {userInfo?.storeEmployees && userInfo.storeEmployees.length > 0 && (
          <div className="w-full border-t border-gray-100 pt-3">
            <p className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              <Store className="h-3 w-3" />
              Assigned Store{userInfo.storeEmployees.length > 1 ? "s" : ""}
            </p>
            <div className="flex flex-col gap-1">
              {userInfo.storeEmployees.map((store) => (
                <span
                  key={store.storeId}
                  className="rounded-lg bg-gray-50 px-2 py-1.5 text-xs font-medium text-gray-700"
                >
                  {store.storeName}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </BigCard>
  );
};

export default ProfileSummaryCard;
