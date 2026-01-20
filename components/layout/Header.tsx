import React, { useEffect, useState } from "react";

import { Bell, Store } from "lucide-react";
import { useSession } from "@/hooks/useSession";
import { StoreInterface } from "@/types/stores";
import { useStores } from "@/hooks/userStore";
import { ApiResponse } from "@/types/api";
import useSWR from "swr";
import { fetcher } from "@/utils/fetcher";
import DynamicDropdown from "../shared/DynamicDropdown";
import toast from "react-hot-toast";
const Header = () => {
  const { user, hasStore, isAdmin, refreshSession } = useSession();
  const { stores } = useStores({ user, hasStore, isAdmin });
  console.log({ stores });
  const [storeData, setStoreData] = useState<StoreInterface | null>(null);
  const isSuperVisor = user?.empPosition === "supervisor";
  console.log("empPosition:", user?.empPosition);
  console.log("empPosition:", user?.empPosition);
  const { data: response, isLoading } = useSWR<ApiResponse<StoreInterface[]>>(
    isSuperVisor ? `/api/stores/userId/${user?.userId}/store-employee/` : null,
    fetcher,
  );
  useEffect(() => {
    // Get store data from localStorage
    const storedStoreData = localStorage.getItem("storeData");

    if (storedStoreData) {
      try {
        const parsedData = JSON.parse(storedStoreData);
        setStoreData(parsedData);
      } catch (error) {
        console.error("Error parsing storeData:", error);
      }
    }
  }, [user]);

  console.log({ response, isSuperVisor });

  const storeOptions = Array.isArray(response?.data)
    ? response.data?.map((store) => ({
        label: store.storeName, // or whatever you want to show
        value: store.storeId ?? 0, // optional leading icon if you have one
      }))
    : [];
  const handleStoreSelection = async (store: StoreInterface) => {
    try {
      // Call the update-token API
      const response = await fetch("/api/auth/store", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Important for cookies
        body: JSON.stringify({ storeId: store.storeId }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        // Update localStorage with new user data

        localStorage.setItem("storeData", JSON.stringify(store));
        await refreshSession();
        toast.success("Store selected successfully!");
      } else {
        toast.error(data.message || "Failed to update token");
      }
    } catch (error) {
      console.error("Error updating token:", error);
      toast.error("Failed to select store");
    }
  };
  return (
    <div className="flex justify-between h-8 md:h-13 xl:h-15 items-center pr-2 pl-2 shadow  bg-white overflow-visible">
      <div className="flex flex-col">
        {isLoading ? (
          ""
        ) : response?.data.length && response?.data.length > 1 ? (
          <DynamicDropdown
            size="md"
            options={storeOptions}
            onChange={function (value: string | number): void {
              const findStore = response.data?.find(
                (s) => s.storeId === Number(value),
              );
              if (findStore) {
                handleStoreSelection(findStore);
              }
            }}
            placeholder={""}
            icon={<Store className="w-4 h-4" />}
            defaultValue={storeData?.storeId ?? 0}
          />
        ) : (
          <span className="font-semibold text-[10px] 2xl:text-lg">
            {storeData?.storeName}
          </span>
        )}
      </div>
      <div className="flex gap-5 items-center">
        <div className="relative flex items-center justify-center w-5 h-5 xl:w-9 xl:h-9 rounded-full bg-gray-300 text-white">
          <Bell className="w-2.5 h-2.5 xl:w-6 xl:h-6" />
          <span className="absolute -top-1 -right-1 flex h-2 w-2  xl:h-4 xl:w-4 items-center justify-center rounded-full bg-red-500 text-[8px] xl:text-[10px] font-bold text-white">
            3
          </span>
        </div>
        <div className="flex items-center justify-center w-5 h-5 xl:w-9 xl:h-9 rounded-full bg-primary-1 text-xs xl:text-xl font-bold text-white">
          {user?.userFullName.charAt(0)}
        </div>
      </div>
    </div>
  );
};

export default Header;
