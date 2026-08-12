"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LogOut,
  Loader2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react";
import Button from "../shared/Button";
import Modal from "../shared/Modal";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useSession } from "@/hooks/useSession";
import useSWR from "swr";
import { fetcher } from "@/utils/fetcher";
import { sideMenu } from "@/lib/sideMenu";

const Sidebar = () => {
  const pathname = usePathname();
  const { user } = useSession();

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

  const [isLoading, setIsLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isShowLogout, setShowLogout] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Width alone can't tell a tablet from a small desktop window - an
    // iPad (even iPad Pro) in landscape reports >= 1024px, which used to
    // get the persistent desktop sidebar instead of the collapsible one.
    // Touch-primary devices (pointer: coarse / hover: none) get the mobile
    // treatment regardless of width; the width check remains as a floor
    // for narrow desktop/laptop windows.
    const checkScreenSize = () => {
      const isTouchPrimary = window.matchMedia(
        "(hover: none), (pointer: coarse)",
      ).matches;
      const isNarrow = window.innerWidth < 1024;
      const mobile = isNarrow || isTouchPrimary;
      setIsMobile(mobile);
      setIsCollapsed(mobile);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const handleLogout = async () => {
    setIsLoading(true);

    try {
      await fetch("/api/auth/logout", { method: "POST" });

      toast.success("Successfully logged out!");
      localStorage.clear();

      window.location.href = "/login";
    } catch (e: any) {
      toast.error("Error: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (user?.userRole === undefined) {
    return (
      <div className="fixed left-0 top-0 h-screen w-64 border-r border-gray-100 bg-white" />
    );
  }

  const role = user?.userRole ?? "";
  const position = user?.empPosition ?? "";

  const assignmentFlags: Record<string, boolean> = {
    hasStockRoom,
    hasStore,
  };

  const sections = sideMenu
    .map((group) => ({
      ...group,
      sections: group.sections.filter((s) => {
        const roleMatch = !s.roles
          ? true
          : s.roles.includes(user?.userRole !== "employee" ? role : position);

        const assignmentMatch = s.alsoShowIf
          ? assignmentFlags[s.alsoShowIf]
          : false;

        return roleMatch || assignmentMatch;
      }),
    }))
    .filter((group) => group.sections.length > 0);

  return (
    <>
      {isMobile && (
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:bg-gray-50"
        >
          <Menu className="h-5 w-5 text-gray-700" />
        </button>
      )}

      {isMobile && !isCollapsed && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 z-50 flex h-screen flex-col
          border-r border-gray-100 bg-white/95 shadow-xl backdrop-blur-md
          transition-all duration-300
          ${!isMobile ? "static shadow-none" : ""}
          ${
            isCollapsed
              ? isMobile
                ? "-translate-x-full w-50"
                : "w-15"
              : isMobile
                ? "translate-x-0 w-50"
                : "w-50"
          }
        `}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-100 px-4">
          {!isCollapsed ? (
            <div className="relative h-9 w-36">
              <Image
                src="/avdclogo.png"
                alt="Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          ) : (
            <div className="relative mx-auto h-10 w-10">
              <Image
                src="/avdcSVG.svg"
                alt="Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          )}

          {!isMobile && (
            <button
              type="button"
              onClick={() => setIsCollapsed((prev) => !prev)}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-50 hover:text-gray-700"
            >
              {isCollapsed ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <ChevronLeft className="h-5 w-5" />
              )}
            </button>
          )}
        </div>

        <nav className="no-scrollbar flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-6">
            {sections.map((menu) => (
              <div key={menu.key}>
                {!isCollapsed && (
                  <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    {menu.key}
                  </p>
                )}

                <div className="space-y-1">
                  {menu.sections.map(({ name, href, icon: Icon }) => {
                    const isActive = pathname.startsWith(href);

                    return (
                      <Link
                        key={name}
                        href={href}
                        aria-current={isActive ? "page" : undefined}
                        title={isCollapsed ? name : undefined}
                        onClick={() => {
                          if (isMobile) {
                            setIsCollapsed(true);
                          }
                          setIsCollapsed(true);
                        }}
                        className={`
                          group flex items-center gap-3 rounded-2xl px-3 py-2.5
                          text-sm font-medium transition-all duration-200
                          ${
                            isActive
                              ? "bg-primary-1 text-white shadow-sm"
                              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                          }
                          ${isCollapsed ? "justify-center" : ""}
                        `}
                      >
                        <Icon
                          className={`
                            h-4 w-4 2xl:h-5 2xl:w-5 shrink-0 transition
                            ${
                              isActive
                                ? "text-white"
                                : "text-gray-400 group-hover:text-gray-700"
                            }
                          `}
                        />

                        {!isCollapsed && (
                          <span className="truncate text-xs">{name}</span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        <div className="border-t border-gray-100 p-3">
          <button
            type="button"
            onClick={() => setShowLogout(true)}
            title={isCollapsed ? "Logout" : undefined}
            className={`
              flex w-full items-center gap-3 rounded-2xl px-3 py-2.5
              text-sm font-medium text-gray-600 transition
              hover:bg-rose-50 hover:text-rose-600
              ${isCollapsed ? "justify-center" : ""}
            `}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>

        <Modal
          showCloseButton={false}
          isOpen={isShowLogout}
          onClose={() => setShowLogout(false)}
        >
          <div className="flex flex-col gap-5 p-2">
            {isLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary-1" />
              </div>
            ) : (
              <>
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50">
                    <XCircle className="h-7 w-7 text-rose-500" />
                  </div>

                  <div>
                    <h1 className="text-base font-semibold text-gray-900">
                      Confirm logout
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                      Are you sure you want to logout? You’ll need to sign in
                      again to continue.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    color="secondary"
                    label="Cancel"
                    onClick={() => setShowLogout(false)}
                  />
                  <Button
                    size="sm"
                    color="danger"
                    label="Logout"
                    onClick={handleLogout}
                    loading={isLoading}
                  />
                </div>
              </>
            )}
          </div>
        </Modal>
      </aside>
    </>
  );
};

export default Sidebar;
