"use client";

import Link from "next/link";
import React, { useState } from "react";
import Image from "next/image";
import Input from "@/components/shared/Input";
import { useRouter } from "next/navigation";
import { handleChange } from "@/utils/handle-change";
import toast, { Toaster } from "react-hot-toast";
import { UserAuthInterface } from "@/types/auth";

const LoginPage = () => {
  const [userAuthForm, setUserAuthForm] = useState<UserAuthInterface>({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false); // ✅ loading state
  const router = useRouter();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleLogin();
  };
  const handleUserAuthChange = handleChange(userAuthForm, setUserAuthForm);
  const handleLogin = async () => {
    setLoading(true); // ✅ start loading
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userAuthForm),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // await refreshSession();
        router.replace("/dashboard");
      } else {
        toast.error(data.message || "Login failed");
      }
    } catch (err) {
      toast.error(`An error occurred during login, ${err}`);
    } finally {
      setLoading(false); // ✅ stop loading
    }
  };
  return (
    <div className="flex text-black justify-center items-center h-screen">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 5000,
          className: "font-semibold",
        }}
      />
      <form
        onSubmit={handleSubmit}
        className="bg-white p-2 rounded-lg shadow-md w-100 space-y-4"
      >
        <Image
          className="mx-auto mb-4"
          src="/avdcSVG.svg"
          alt="Logo"
          width={100}
          height={80}
        />
        <div className="text-center">
          {" "}
          <h2 className="text-xl font-semibold text-center">Welcome Back!</h2>
          <span className="text-sm font-semibold text-gray-600">
            Log in to your account.
          </span>
        </div>

        <div className="p-4 space-y-4">
          <Input
            label={"Username"}
            name="username"
            sizes="sm"
            value={userAuthForm.username}
            onChange={handleUserAuthChange}
            // disabled={loading}
          />
          <Input
            label={"Password"}
            name="password"
            sizes="sm"
            type="password"
            value={userAuthForm.password}
            onChange={handleUserAuthChange}
            // disabled={loading}
          />
          <button
            type="submit"
            className={`w-full text-sm font-semibold text-white py-2 rounded ${
              loading ? "bg-gray-400" : "bg-primary-1 hover:bg-primary-1-hover"
            }`}
            disabled={loading}
          >
            Log In
          </button>
          <h4 className="text-xs text-center text-gray-500 font-semibold">
            <Link
              href="/forgot-password"
              className="hover:underline text-black"
            >
              Forgot Password
            </Link>
          </h4>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;
