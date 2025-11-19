"use client";
import Image from "next/image";
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
  ChevronLeft,
  ChevronRight,
  Menu,
  Warehouse,
} from "lucide-react";
import Button from "../shared/Button";
import Modal from "../shared/Modal";
import { useEffect, useState } from "react";
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
          "superadmin",
          "owner",
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
        roles: ["admin", "supervisor", "owner", "staff"],
      },
    ],
  },
  {
    key: "Inventory Management",
    sections: [
      {
        name: "Stock Room",
        href: "/stock-room",
        icon: Warehouse,
        roles: ["superadmin", "owner", "admin", "accounting", "hr"],
      },
      {
        name: "Products",
        href: "/products",
        icon: Package,
        roles: [
          "superadmin",
          "admin",
          "purchaser",
          "supervisor",
          "accounting",
          "hr",
          "staff",
          "owner",
        ],
      },
      {
        name: "Categories",
        href: "/categories",
        icon: Boxes,
        roles: [
          "superadmin",
          "admin",
          "purchaser",
          "supervisor",
          "accounting",
          "hr",
          "staff",
          "owner",
        ],
      },
      {
        name: "Inventory",
        href: "/inventory",
        icon: ClipboardList,
        roles: [
          "superadmin",
          "admin",
          "purchaser",
          "supervisor",
          "accounting",
          "hr",
          "staff",
          "owner",
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
        roles: [
          "superadmin",
          ,
          "admin",
          "supervisor",
          "accounting",
          "staff",
          "owner",
        ],
      },
      {
        name: "Customers",
        href: "/customers",
        icon: Users,
        roles: [
          "superadmin",
          "admin",
          "supervisor",
          "accounting",
          "staff",
          "owner",
        ],
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
        roles: [
          "superadmin",
          "admin",
          "purchaser",
          "accounting",
          "staff",
          "owner",
        ],
      },
      {
        name: "Requisitions",
        href: "/requisitions",
        icon: ShoppingBag,
        roles: [
          "superadmin",
          "admin",
          "purchaser",
          "supervisor",
          "accounting",
          "hr",
          "staff",
          "owner",
        ],
      },
      {
        name: "Procurement History",
        href: "/procurement-history",
        icon: History,
        roles: [
          "superadmin",
          "admin",
          "purchaser",
          "accounting",
          "hr",
          "owner",
        ],
      },
      {
        name: "Suppliers",
        href: "/suppliers",
        icon: Truck,
        roles: [
          "superadmin",
          "admin",
          "purchaser",
          "accounting",
          "hr",
          "owner",
        ],
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
        roles: ["superadmin", "admin", "accounting", "hr", "owner"],
      },
      {
        name: "Employees",
        href: "/employees",
        icon: UserCog,
        roles: [
          "superadmin",
          "admin",
          "purchaser",
          "supervisor",
          "accounting",
          "hr",
          "staff",
          "owner",
        ],
      },
      {
        name: "Store",
        href: "/stores",
        icon: Building2,
        roles: [
          "superadmin",
          "admin",
          "purchaser",
          "supervisor",
          "accounting",
          "hr",
          "staff",
          "owner",
        ],
      },
    ],
  },
];

const Sidebar = () => {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isShowLogout, setShowLogout] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { user } = useSession();
  console.log({ user });

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint (1024px)
      setIsMobile(mobile);
      setIsCollapsed(mobile); // Auto-collapse on mobile
    };

    // Check on mount
    checkScreenSize();

    // Add resize listener
    window.addEventListener("resize", checkScreenSize);

    // Cleanup
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);
  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Successfully logged out!");
      localStorage.clear();
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
          s.roles.includes(user?.userRole !== "employee" ? role : position) // allow if no roles OR matches
      ),
    }))
    .filter((group) => group.sections.length > 0); // r

  return (
    <>
      {/* Mobile Menu Button - Only show on mobile */}
      {isMobile && (
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50 transition-colors"
        >
          <Menu size={20} className="text-gray-600" />
        </button>
      )}

      {/* Mobile Overlay - Only show when sidebar is open on mobile */}
      {isMobile && !isCollapsed && (
        <div
          className="lg:hidden fixed inset-0 bg-transparent bg-opacity-50 z-40"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      <aside
        className={`fixed  lg:static top-0 left-0 h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-300 z-50 overflow-y-auto  ${
          isCollapsed
            ? isMobile
              ? "-translate-x-full lg:translate-x-0 lg:w-20"
              : "lg:w-20"
            : isMobile
            ? "translate-x-0 w-64"
            : "w-64"
        }`}
      >
        {/* Toggle Button */}
        <div className="flex justify-between h-15 pr-2 pl-2 shadow">
          <div className="flex flex-1 items-center justify-between">
            {!isCollapsed ? (
              <div className="relative w-32 h-8 flex-shrink-0">
                {" "}
                {/* Fixed dimensions */}
                <Image
                  src="/avdclogo.png"
                  alt="Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            ) : (
              <div className="relative w-10 h-15 flex-shrink-0">
                <Image
                  src="/avdcSVG.svg"
                  alt="Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-md hover:bg-gray-100 transition-colors flex-shrink-0"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <ChevronRight size={18} className="text-gray-600" />
              ) : (
                <ChevronLeft size={18} className="text-gray-600" />
              )}
            </button>
          </div>
        </div>

        <nav className="flex-1 flex flex-col p-4">
          <div className={isCollapsed ? "space-y-2" : "space-y-3"}>
            {sections.map((menu) => (
              <div key={menu.key}>
                {!isCollapsed && (
                  <label className="text-[10px] xl:text-xs font-semibold text-gray-500 tracking-wider block mb-2 transition-all duration-300 delay-75">
                    {menu.key}
                  </label>
                )}
                <div className="space-y-1">
                  {menu.sections.map(({ name, href, icon: Icon }) => {
                    const isActive = pathname.startsWith(href);
                    return (
                      <Link
                        key={name}
                        href={href}
                        aria-current={isActive ? "page" : undefined}
                        className={`flex items-center gap-3 px-3 py-2 rounded-md text-[9px] xl:text-sm font-semibold transition-all duration-300 ${
                          isActive
                            ? "bg-gray-100 text-primary-600"
                            : "text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                        }`}
                        title={isCollapsed ? name : undefined}
                        onClick={() => {
                          // Auto-close sidebar on mobile after clicking a link
                          if (isMobile) {
                            setIsCollapsed(true);
                          }
                        }}
                      >
                        <Icon
                          size={18}
                          className={`flex-shrink-0 transition-transform duration-300 ${
                            isActive ? "text-primary-600" : "text-gray-500"
                          }`}
                        />
                        <span
                          className={`transition-all duration-300 whitespace-nowrap ${
                            isCollapsed
                              ? "w-0 opacity-0 -translate-x-2"
                              : "w-auto opacity-100 translate-x-0"
                          }`}
                        >
                          {name}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="w-full mt-auto">
              <button
                onClick={() => setShowLogout(true)}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-all duration-300 w-full"
                title={isCollapsed ? "Logout" : undefined}
              >
                <LogOut
                  size={18}
                  className="flex-shrink-0 text-gray-500 group-hover:text-primary-600"
                />
                <span
                  className={`transition-all duration-300 whitespace-nowrap text-[9px] xl:text-sm ${
                    isCollapsed
                      ? "w-0 opacity-0 -translate-x-2"
                      : "w-auto opacity-100 translate-x-0"
                  }`}
                >
                  Logout
                </span>
              </button>
            </div>
          </div>
        </nav>
        <Modal
          showCloseButton={false}
          isOpen={isShowLogout}
          onClose={() => {
            setShowLogout(false);
          }}
        >
          <div className="flex flex-col">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="w-5 h-5 animate-spin text-primary-1" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4 p-2">
                  <div className="flex-none">
                    <XCircle
                      className=" h-8 w-8 sm:h-10 sm:w-10 text-red-500"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-sm sm:text-lg font-semibold text-primary-1">
                      Confirm Logout
                    </h1>
                    <p className="mt-1 text-xs sm:text-sm text-primary-1">
                      Are you sure you want to logout? You&apos;ll need to sign
                      in again to continue.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 justify-end">
                  <Button
                    size="sm"
                    color="danger"
                    label="Keep me login!"
                    onClick={() => {
                      setShowLogout(false);
                    }}
                  />
                  <Button
                    size="sm"
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
    </>
  );
};

export default Sidebar;
