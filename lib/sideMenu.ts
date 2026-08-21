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
  Warehouse,
  Weight,
  ShieldUser,
  Factory,
  LucideIcon,
  ListOrdered,
  Ticket,
  Tablet,
  Briefcase,
  Settings,
  Receipt,
} from "lucide-react";

export interface SideMenuSection {
  name: string;
  href: string;
  icon: LucideIcon;
  roles?: (string | undefined)[];
  alsoShowIf?: "hasStockRoom" | "hasStore";
  // Per-store feature toggle (Stores.storeKioskEnabled/storeOrderEnabled) -
  // only enforced for users scoped to a single store (employees); Owner/
  // Admin/Super Admin aren't tied to one store so this is skipped for them.
  requiresFeature?: "kiosk" | "order";
  // Shows a small count badge next to the label (e.g. pending orders).
  badgeKey?: "pendingOrders";
}

export interface SideMenuGroup {
  key: string;
  sections: SideMenuSection[];
}

// Single source of truth for both the Sidebar nav (which links show) and
// RequireRole (which pages actually allow access) - keeping these in one
// place means they can't drift apart the way they did before.
export const sideMenu: SideMenuGroup[] = [
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
        roles: ["supervisor", "staff"],
      },
      {
        name: "Kiosks",
        href: "/kiosks",
        icon: Tablet,
        roles: ["supervisor", "staff"],
        requiresFeature: "kiosk",
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
        alsoShowIf: "hasStockRoom",
      },
      {
        name: "Products",
        href: "/products",
        icon: Package,
        roles: [
          "superadmin",
          "admin",
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
        alsoShowIf: "hasStore",
      },
    ],
  },
  {
    key: "Sales & Customers",
    sections: [
      {
        name: "Sales",
        href: "/sales",
        icon: Weight,
        roles: [
          "superadmin",
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
      {
        name: "Orders",
        href: "/orders",
        icon: ListOrdered,
        roles: [
          "superadmin",
          "admin",
          "supervisor",
          "accounting",
          "staff",
          "owner",
        ],
        requiresFeature: "order",
        badgeKey: "pendingOrders",
      },
      {
        name: "Vouchers",
        href: "/vouchers",
        icon: Ticket,
        roles: ["superadmin", "owner", "admin", "accounting"],
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
        name: "Companies",
        href: "/companies",
        icon: Briefcase,
        roles: ["superadmin"],
      },
      {
        name: "Platform Settings",
        href: "/platform-settings",
        icon: Settings,
        roles: ["superadmin"],
      },
      {
        name: "Billing",
        href: "/billing",
        icon: Receipt,
        roles: ["owner"],
      },
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
          "accounting",
          "hr",
          "owner",
        ],
      },
      {
        name: "ISR",
        href: "/isr",
        icon: Factory,
        roles: ["superadmin", "admin", "owner"],
      },
      {
        name: "Account",
        href: "/account",
        icon: ShieldUser,
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
