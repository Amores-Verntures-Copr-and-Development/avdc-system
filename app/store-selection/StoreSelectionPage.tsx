"use client";

import LoaderComponent from "@/components/shared/LoaderComponent";
import { useSession } from "@/hooks/useSession";
import { StockRoom } from "@/types/stockRoom";
import { StoreInterface } from "@/types/stores";
import { fetcher } from "@/utils/fetcher";
import React from "react";
import useSWR from "swr";
import StoreCard from "./_component.tsx/StoreCard";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

const StoreSelectionPage = () => {
  const router = useRouter();
  const { user, loading: userLoading, refreshSession } = useSession();
  const {
    data: response = { data: [] },
    mutate,
    isLoading: fetchLoading,
  } = useSWR<{
    data: StoreInterface[];
  }>(user ? `/api/stores/userId/${user.userId}/store-employee` : null, fetcher);

  if (userLoading && fetchLoading)
    return <LoaderComponent title="Fetchin store.." />;
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
      console.log({ user });
      if (response.ok && data.success) {
        // Update localStorage with new user data
        localStorage.setItem("userData", JSON.stringify(data.user));
        localStorage.setItem("storeData", JSON.stringify(store));
        await refreshSession();
        toast.success("Store selected successfully!");
        console.log("Agi diri sa dashboard");
        router.push("/dashboard");
      } else {
        toast.error(data.message || "Failed to update token");
      }
    } catch (error) {
      console.error("Error updating token:", error);
      toast.error("Failed to select store");
    }
  };
  return (
    <div className="flex flex-col gap-2 items-center justify-center h-screen">
      <h1> Choose Store to Operate!</h1>
      <div className="flex gap-2">
        {response.data.map((store) => (
          <StoreCard
            data={store}
            key={store.storeId}
            onClick={handleStoreSelection}
          />
        ))}
      </div>
    </div>
  );
};

export default StoreSelectionPage;
