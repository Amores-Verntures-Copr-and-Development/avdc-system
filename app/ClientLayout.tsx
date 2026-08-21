"use client";

import Sidebar from "@/components/layout/Sidebar";
import React, { Suspense, useEffect } from "react";
import Header from "@/components/layout/Header";
import { usePathname, useRouter } from "next/navigation";
import { Toaster } from "react-hot-toast";
import { useSession } from "@/hooks/useSession";
import { useFullscreen } from "@/hooks/useFullscreen";
// Create this component

const ClientLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: isLoading } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  // document.fullscreenElement is global, so this independently observes
  // the same state as the toggle button inside KiosksPage - no need to
  // thread it down through props/context.
  const { isFullscreen } = useFullscreen();

  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password";

  useEffect(() => {
    if (isAuthPage) {
      router.replace("/login");
    }
  }, [isAuthPage, router]);

  useEffect(() => {
    // Check if user needs store selection
    if (user && !isLoading) {
      const needsStoreSelection =
        (user.empPosition === "supervisor" || user.empPosition === "staff") &&
        !user.storeId;

      if (needsStoreSelection && pathname !== "/store-selection") {
        // Redirect to store selection page
        router.push("/store-selection");
      }
    }
  }, [user, isLoading, pathname, router]);

  // Show loading while checking session
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-dvh">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // For auth pages
  if (isAuthPage) {
    return <div className="w-full h-dvh">{children}</div>;
  }

  // For store selection page
  if (pathname === "/store-selection") {
    return (
      <div className="w-full h-dvh">
        {children}
        <Toaster position="top-right" />
      </div>
    );
  }

  // Kiosks are a customer-facing display, full-screened on a tablet once
  // set up - only hide the staff Sidebar/Header once actually in full
  // screen, so whoever's setting up the kiosk still has normal navigation
  // beforehand instead of getting stranded on a shell-less page.
  if (pathname.startsWith("/kiosks") && isFullscreen) {
    return (
      <div className="w-full h-dvh">
        {children}
        <Toaster position="top-right" />
      </div>
    );
  }

  // Check if user needs to select a store
  if (
    (user?.empPosition === "supervisor" || user?.empPosition === "staff") &&
    !user?.storeId
  ) {
    return (
      <div className="flex items-center justify-center h-dvh bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to store selection...</p>
        </div>
      </div>
    );
  }

  // Regular layout for authenticated users with store
  return (
    <div className="h-dvh w-screen flex overflow-hidden">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          className: "font-semibold text-sm",
        }}
      />
      <div className="flex-1 min-h-0 min-w-0 flex flex-row">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0 contain-layout">
          <Header />
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            }
          >
            <div className="flex-1 min-h-0 flex flex-col">{children}</div>
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default ClientLayout;
