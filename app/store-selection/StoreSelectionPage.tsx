"use client";

import LoaderComponent from "@/components/shared/LoaderComponent";
import { useSession } from "@/hooks/useSession";

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
      if (response.ok && data.success) {
        // Update localStorage with new user data
   
        localStorage.setItem("storeData", JSON.stringify(store));
        await refreshSession();
        toast.success("Store selected successfully!");
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
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-b from-gray-50 to-white">
      {/* Header Section */}
      <header className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
          Choose Store to Operate!
        </h1>
        <p className="text-gray-600 max-w-md">
          Select a store below to continue to your dashboard
        </p>
      </header>

      {/* Loading State */}
      {fetchLoading ? (
        <div className="flex flex-col items-center gap-4">
          <LoaderComponent />
          <p className="text-gray-500 animate-pulse">
            Loading available stores...
          </p>
        </div>
      ) : (
        <main className="w-full max-w-6xl">
          {/* Results Count */}
          <div className="mb-6 text-center">
            <span className="inline-block px-3 py-1 bg-pink-100 text-primary-1 rounded-full text-sm font-medium">
              {response.data.length}{" "}
              {response.data.length === 1 ? "store" : "stores"} available
            </span>
          </div>

          {/* Store Cards Grid */}
          {response.data.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {response.data.map((store) => (
                <StoreCard
                  data={store}
                  key={store.storeId}
                  onClick={() => handleStoreSelection(store)}
                />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50">
              <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
                <svg
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                No Stores Available
              </h2>
              <p className="text-gray-500 max-w-sm mx-auto">
                You don&apos;t have access to any stores yet. Please contact
                your administrator.
              </p>
            </div>
          )}
        </main>
      )}

      {/* Help/Support Link */}
      {!fetchLoading && response.data.length > 0 && (
        <footer className="mt-10 text-center">
          <p className="text-sm text-gray-500">
            Need help?{" "}
            <button className="text-primary-1-hover hover:text-primary-1-hover font-medium">
              Contact Support
            </button>
          </p>
        </footer>
      )}
    </div>
  );
};

export default StoreSelectionPage;
