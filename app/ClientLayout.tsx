"use client";

import Sidebar from "@/components/layout/Sidebar";
import React, { useEffect } from "react";

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
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 5000,
          className: "font-semibold",
        }}
      />
      <Header />
      <div className="flex-1 min-h-0 flex flex-row">
        <Sidebar />
        <div className="flex-1 min-h-0 flex flex-col p-6">{children}</div>
      </div>
    </div>
  );
};

export default ClientLayout;
