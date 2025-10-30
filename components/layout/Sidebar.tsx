"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  ClipboardList,
  Users,
  History,
  FileText,
  ShoppingBag,
  Truck,
  Building2,
  UserCog,
  ContactRound,
  LogOut,
  Loader2,
  XCircle,
} from "lucide-react";
import Button from "../shared/Button";
import Modal from "../shared/Modal";
import { useState } from "react";
import toast from "react-hot-toast";
import { useSession } from "@/hooks/useSession";

const sideMenu = [
  {
    key: "Main",
    sections: [
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        roles: [
          "admin",
          "purchaser",
          "supervisor",
          "accounting",
          "hr",
          "staff",
        ],
      },
      {
        name: "Point of Sale",
        href: "/pos",
        icon: ShoppingCart,
        roles: ["admin", "supervisor", "staff"],
      },
    ],
  },
  {
    key: "Inventory Management",
    sections: [
      {
        name: "Products",
        href: "/products",
        icon: Package,
        roles: [
          "admin",
          "purchaser",
          "supervisor",
          "accounting",
          "hr",
          "staff",
        ],
      },
      {
        name: "Categories",
        href: "/categories",
        icon: Boxes,
        roles: [
          "admin",
          "purchaser",
          "supervisor",
          "accounting",
          "hr",
          "staff",
        ],
      },
      {
        name: "Inventory",
        href: "/inventory",
        icon: ClipboardList,
        roles: [
          "admin",
          "purchaser",
          "supervisor",
          "accounting",
          "hr",
          "staff",
        ],
      },
    ],
  },
  {
    key: "Sales & Customers",
    sections: [
      {
        name: "Sales History",
        href: "/sales-history",
        icon: History,
        roles: ["admin", "supervisor", "accounting", "staff"],
      },
      {
        name: "Customers",
        href: "/customers",
        icon: Users,
        roles: ["admin", "supervisor", "accounting", "staff"],
      },
    ],
  },
  {
    key: "Procurement",
    sections: [
      {
        name: "Purchase Order",
        href: "/purchase-orders",
        icon: FileText,
        roles: ["admin", "purchaser", "accounting", "staff"],
      },
      {
        name: "Requisitions",
        href: "/requisitions",
        icon: ShoppingBag,
        roles: [
          "admin",
          "purchaser",
          "supervisor",
          "accounting",
          "hr",
          "staff",
        ],
      },
      {
        name: "Procurement History",
        href: "/procurement-history",
        icon: History,
        roles: ["admin", "purchaser", "accounting", "hr"],
      },
      {
        name: "Suppliers",
        href: "/suppliers",
        icon: Truck,
        roles: ["admin", "purchaser", "accounting", "hr"],
      },
    ],
  },
  {
    key: "Administration",
    sections: [
      {
        name: "Users",
        href: "/users",
        icon: ContactRound,
        roles: ["admin", "accounting", "hr"],
      },
      {
        name: "Employees",
        href: "/employees",
        icon: UserCog,
        roles: [
          "admin",
          "purchaser",
          "supervisor",
          "accounting",
          "hr",
          "staff",
        ],
      },
      {
        name: "Store",
        href: "/stores",
        icon: Building2,
        roles: [
          "admin",
          "purchaser",
          "supervisor",
          "accounting",
          "hr",
          "staff",
        ],
      },
    ],
  },
];

const Sidebar = () => {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [isShowLogout, setShowLogout] = useState(false);
  const { user } = useSession();
  console.log({ user });
  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Successfully logged out!");
      setIsLoading(false);

      // // Redirect to login page after clearing state
      window.location.href = "/login";
    } catch (e: any) {
      setIsLoading(false);
      toast.error("Error: " + e.message);
    }
  };
  if (user?.userRole === undefined) {
    return (
      <div className="fixed top-0 left-0 h-screen w-64 bg-white text-white flex flex-col">
        <nav className="flex-1 p-5 space-y-6 overflow-y-auto"></nav>
      </div>
    );
  }
  const role = user?.userRole ?? "";
  const position = user?.empPosition ?? "";
  const sections = sideMenu
    .map((group) => ({
      ...group,
      sections: group.sections.filter(
        (s) =>
          !s.roles ||
          s.roles.includes(user?.userRole === "admin" ? role : position) // allow if no roles OR matches
      ),
    }))
    .filter((group) => group.sections.length > 0); // r

  return (
    <aside className="top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col">
      <nav className="flex-1 p-5 space-y-6 overflow-y-auto">
        {sections.map((menu) => (
          <div key={menu.key}>
            <label className="text-xs font-semibold text-gray-500  tracking-wider">
              {menu.key}
            </label>
            <div className="mt-2 space-y-1">
              {menu.sections.map(({ name, href, icon: Icon }) => {
                const isActive = pathname.startsWith(href);
                return (
                  <Link
                    key={name}
                    href={href}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-gray-100 text-primary-600"
                        : "text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                    }`}
                  >
                    <Icon
                      size={18}
                      className={`${
                        isActive ? "text-primary-600" : "text-gray-500"
                      }`}
                    />
                    {name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
        <div className="w-full mt-4">
          <button
            onClick={() => {
              setShowLogout(true);
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-colors"
          >
            <LogOut
              size={18}
              className="text-gray-500 group-hover:text-primary-600"
            />
            Logout
          </button>
        </div>
      </nav>
      <Modal
        showCloseButton={false}
        isOpen={isShowLogout}
        onClose={() => {
          setShowLogout(false);
        }}
      >
        <div className="h-30">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="w-5 h-5 animate-spin text-primary-1" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4 p-2">
                <div className="flex-none">
                  <XCircle
                    className="h-10 w-10 text-red-500"
                    aria-hidden="true"
                  />
                </div>
                <div className="flex-1">
                  <h1 className="text-lg font-semibold text-primary-1">
                    Confirm Logout
                  </h1>
                  <p className="mt-1 text-sm text-primary-1">
                    Are you sure you want to logout? You’ll need to sign in
                    again to continue.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 justify-end">
                <Button
                  color="danger"
                  label="Keep me login!"
                  onClick={() => {
                    setShowLogout(false);
                  }}
                />
                <Button
                  color="secondary"
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
  );
};

export default Sidebar;
