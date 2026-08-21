import { Card, CardContent } from "@/components/shared/CustomCard";
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
    <Card>
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-1 to-primary-1/60 text-lg font-bold text-white shadow-sm">
          {initials}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <h2 className="truncate text-base font-semibold text-gray-900">
            {fullName}
          </h2>

          {userInfo?.userEmail && (
            <p className="flex items-center gap-1.5 text-xs text-gray-500">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{userInfo.userEmail}</span>
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-0.5">
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

            {userInfo?.storeEmployees?.map((store) => (
              <span
                key={store.storeId}
                className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold text-gray-600"
              >
                <Store className="h-3 w-3" />
                {store.storeName}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileSummaryCard;
