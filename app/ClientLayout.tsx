"use client";

import Sidebar from "@/components/layout/Sidebar";
import React, { Suspense, useEffect } from "react";

import Header from "@/components/layout/Header";
import { usePathname, useRouter } from "next/navigation";
import { Toaster } from "react-hot-toast";
const ClientLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password";
  useEffect(() => {
    if (isAuthPage) {
      // 🚨 clears everything
      router.replace("/login");
    }
  }, [isAuthPage, router]);
  if (isAuthPage) {
    return <div className="w-full h-dvh">{children}</div>;
  }
  return (
    <div className="h-screen w-screen flex overflow-hidden">
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 5000,
          className: "font-semibold",
        }}
      />
      <div className="flex-1 min-h-0 flex flex-row">
        <Sidebar />
        <div className="flex flex-col flex-1">
          {" "}
          <Header />
          <Suspense fallback={<div>Loading...</div>}>
            <div className="flex-1 min-h-0 flex flex-col">{children}</div>
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default ClientLayout;
