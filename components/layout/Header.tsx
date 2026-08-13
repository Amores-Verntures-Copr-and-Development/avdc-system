import React, { useEffect, useRef, useState } from "react";
import { Bell, Maximize2, Minimize2, Store } from "lucide-react";
import { useSession } from "@/hooks/useSession";
import { useFullscreen } from "@/hooks/useFullscreen";
import { StoreInterface } from "@/types/stores";
import { useStores } from "@/hooks/userStore";
import { ApiResponse } from "@/types/api";
import useSWR from "swr";
import { fetcher } from "@/utils/fetcher";
import DynamicDropdown from "../shared/DynamicDropdown";
import toast from "react-hot-toast";

const Header = () => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [storeData, setStoreData] = useState<StoreInterface | null>(null);

  const notifRef = useRef<HTMLDivElement>(null);

  const { user, hasStore, isAdmin, refreshSession } = useSession();
  useStores({ user, hasStore, isAdmin });
  const { isFullscreen, isSupported: isFullscreenSupported, toggle: toggleFullscreen } =
    useFullscreen();

  const isSuperVisor = user?.empPosition === "supervisor";

  const { data: response, isLoading } = useSWR<ApiResponse<StoreInterface[]>>(
    isSuperVisor ? `/api/stores/userId/${user?.userId}/store-employee/` : null,
    fetcher,
  );

  useEffect(() => {
    const storedStoreData = localStorage.getItem("storeData");

    if (!storedStoreData) return;

    try {
      setStoreData(JSON.parse(storedStoreData));
    } catch (error) {
      console.error("Error parsing storeData:", error);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target as Node)
      ) {
        setIsNotifOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const storeOptions = Array.isArray(response?.data)
    ? response.data.map((store) => ({
        label: store.storeName,
        value: store.storeId ?? 0,
      }))
    : [];

  const handleStoreSelection = async (store: StoreInterface) => {
    try {
      const response = await fetch("/api/auth/store", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ storeId: store.storeId }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem("storeData", JSON.stringify(store));
        // Clear the previous store's POS cart so it doesn't leak into the new store
        localStorage.removeItem("selectedOrder");
        await refreshSession();
        toast.success("Store selected successfully!");
        window.location.reload();
        return;
      }

      toast.error(data.message || "Failed to update token");
    } catch (error) {
      console.error("Error updating token:", error);
      toast.error("Failed to select store");
    }
  };

  return (
    <header className="sticky top-0 z-40 flex h-12 items-center justify-between border-b border-gray-100 bg-white/90 px-2 shadow-sm backdrop-blur-md sm:h-14 sm:px-4 xl:h-16">
      {/* Left */}
      <div className="flex min-w-0 items-center">
        {!isLoading && response?.data && response.data.length > 1 && (
          <div className="w-28 sm:w-36 lg:w-44">
            <DynamicDropdown
              size="sm"
              options={storeOptions}
              onChange={(value) => {
                const selectedStore = response.data?.find(
                  (s) => s.storeId === Number(value),
                );

                if (selectedStore) {
                  handleStoreSelection(selectedStore);
                }
              }}
              placeholder="Select store"
              icon={<Store className="h-4 w-4" />}
              defaultValue={storeData?.storeId ?? 0}
            />
          </div>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-1.5 sm:gap-2 xl:gap-3">
        {isFullscreenSupported && (
          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit full screen" : "Full screen"}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-100 bg-white text-gray-600 shadow-sm transition hover:bg-gray-50 sm:h-9 sm:w-9"
          >
            {isFullscreen ? (
              <Minimize2 className="h-3.5 w-3.5 text-primary-1 sm:h-4 sm:w-4" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5 text-primary-1 sm:h-4 sm:w-4" />
            )}
          </button>
        )}

        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setIsNotifOpen((prev) => !prev)}
            className="relative flex h-8 w-8 items-center justify-center rounded-full border border-gray-100 bg-white text-gray-600 shadow-sm transition hover:bg-gray-50 sm:h-9 sm:w-9"
          >
            <Bell className="h-3.5 w-3.5 text-primary-1 sm:h-4 sm:w-4" />

            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
              3
            </span>
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-3 w-72 max-w-[90vw] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl sm:w-80">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Notifications
                  </h3>
                  <p className="text-xs text-gray-400">Latest updates</p>
                </div>

                <button
                  type="button"
                  className="text-xs font-medium text-primary-1 hover:underline"
                >
                  Mark all as read
                </button>
              </div>

              <div className="flex min-h-32 items-center justify-center px-4 py-8">
                <p className="text-sm text-gray-400">No notifications</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-1 text-xs font-bold text-white shadow-sm sm:h-9 sm:w-9 sm:text-sm">
          {user?.userFullName?.charAt(0) ?? "U"}
        </div>
      </div>
    </header>
  );
};

export default Header;
