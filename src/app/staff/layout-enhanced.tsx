"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  LayoutDashboard,
  FolderOpen,
  FileText,
  DollarSign,
  BarChart3,
  CheckSquare,
  Users,
  Package,
  TruckIcon,
  Calculator,
  Building2,
  Wallet,
  Clock,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";

/**
 * Enhanced Staff Dashboard Layout
 * 
 * Unified workspace for:
 * - CRM (Cases, Contracts, Families)
 * - ERP (FinOps, Payroll, Procurement, Inventory)
 * 
 * Features:
 * - Workspace grouping with collapsible sections
 * - Role-based visibility
 * - Command palette support
 */

interface NavSection {
  label: string;
  description: string;
  defaultOpen: boolean;
  items: NavItem[];
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  description: string;
  badge?: string; // Optional badge (e.g., "Beta", "New")
  roles?: string[]; // Optional role restriction
}

const workspaces: NavSection[] = [
  {
    label: "Operations",
    description: "Funeral case management",
    defaultOpen: true,
    items: [
      {
        label: "Dashboard",
        href: "/staff/dashboard",
        icon: <LayoutDashboard className="w-5 h-5" />,
        description: "Overview and KPIs",
      },
      {
        label: "Cases",
        href: "/staff/cases",
        icon: <FolderOpen className="w-5 h-5" />,
        description: "Manage funeral cases",
      },
      {
        label: "Contracts",
        href: "/staff/contracts",
        icon: <FileText className="w-5 h-5" />,
        description: "Contract management",
      },
      {
        label: "Families",
        href: "/staff/families",
        icon: <Users className="w-5 h-5" />,
        description: "Family invitations",
      },
      {
        label: "Tasks",
        href: "/staff/tasks",
        icon: <CheckSquare className="w-5 h-5" />,
        description: "Task management",
      },
    ],
  },
  {
    label: "Finance (FinOps)",
    description: "Financial operations",
    defaultOpen: true,
    items: [
      {
        label: "Payments",
        href: "/staff/payments",
        icon: <DollarSign className="w-5 h-5" />,
        description: "Payment processing",
      },
      {
        label: "GL & Reporting",
        href: "/staff/finops",
        icon: <Calculator className="w-5 h-5" />,
        description: "General ledger",
        badge: "ERP",
        roles: ["accountant", "admin"],
      },
      {
        label: "Accounts Payable",
        href: "/staff/finops/ap",
        icon: <Wallet className="w-5 h-5" />,
        description: "AP invoices & bills",
        badge: "ERP",
        roles: ["accountant", "admin"],
      },
      {
        label: "Analytics",
        href: "/staff/analytics",
        icon: <BarChart3 className="w-5 h-5" />,
        description: "Reports and insights",
      },
    ],
  },
  {
    label: "HR & Payroll",
    description: "Human resources",
    defaultOpen: false,
    items: [
      {
        label: "Payroll",
        href: "/staff/payroll",
        icon: <Clock className="w-5 h-5" />,
        description: "Payroll processing",
        badge: "ERP",
        roles: ["payroll_admin", "admin"],
      },
      {
        label: "Time Tracking",
        href: "/staff/payroll/time",
        icon: <Clock className="w-5 h-5" />,
        description: "Employee time entries",
        badge: "ERP",
        roles: ["funeral_director", "payroll_admin", "admin"],
      },
    ],
  },
  {
    label: "Procurement",
    description: "Purchasing & suppliers",
    defaultOpen: false,
    items: [
      {
        label: "Purchase Orders",
        href: "/staff/procurement",
        icon: <FileText className="w-5 h-5" />,
        description: "Create and manage POs",
        badge: "ERP",
        roles: ["accountant", "admin"],
      },
      {
        label: "Inventory",
        href: "/staff/inventory",
        icon: <Package className="w-5 h-5" />,
        description: "Stock and supplies",
        badge: "ERP",
        roles: ["funeral_director", "accountant", "admin"],
      },
      {
        label: "Suppliers",
        href: "/staff/procurement/suppliers",
        icon: <Building2 className="w-5 h-5" />,
        description: "Supplier management",
        badge: "ERP",
        roles: ["accountant", "admin"],
      },
    ],
  },
  {
    label: "Logistics",
    description: "Shipping & tracking",
    defaultOpen: false,
    items: [
      {
        label: "Shipments",
        href: "/staff/scm",
        icon: <TruckIcon className="w-5 h-5" />,
        description: "Track shipments",
        badge: "ERP",
        roles: ["funeral_director", "admin"],
      },
    ],
  },
];

interface WorkspaceSectionProps {
  section: NavSection;
  pathname: string | null;
  userRoles: string[]; // Pass from auth context
}

function WorkspaceSection({ section, pathname, userRoles }: WorkspaceSectionProps) {
  const [isOpen, setIsOpen] = useState(section.defaultOpen);

  // Filter items based on user roles
  const visibleItems = section.items.filter((item) => {
    if (!item.roles) return true; // No role restriction
    return item.roles.some((role) => userRoles.includes(role));
  });

  if (visibleItems.length === 0) return null;

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 text-sm font-semibold text-white/60 hover:text-white transition"
      >
        <div>
          <div>{section.label}</div>
          <div className="text-xs font-normal opacity-60">{section.description}</div>
        </div>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="mt-1 space-y-1">
          {visibleItems.map((item) => {
            const isActive =
              pathname === item.href || pathname?.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg transition
                  ${
                    isActive
                      ? "bg-[--sage] text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }
                `}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[--gold] text-[--navy] font-semibold">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-xs opacity-70 truncate">
                    {item.description}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function StaffLayoutEnhanced({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // TODO: Get user roles from Clerk/Auth context
  // For now, mock admin access
  const userRoles = ["admin", "funeral_director", "accountant", "payroll_admin"];

  // Find current workspace for header title
  const currentItem = workspaces
    .flatMap((section) => section.items)
    .find((item) => pathname === item.href || pathname?.startsWith(item.href + "/"));

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-72 bg-[--navy] text-white fixed inset-y-0 left-0 z-50 overflow-y-auto">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <h1 className="text-xl font-serif">Dykstra Funeral Home</h1>
          <p className="text-sm text-white/70 mt-1">Unified Platform</p>
        </div>

        {/* Navigation */}
        <nav className="p-4">
          {workspaces.map((section) => (
            <WorkspaceSection
              key={section.label}
              section={section}
              pathname={pathname}
              userRoles={userRoles}
            />
          ))}
        </nav>

        {/* User section at bottom */}
        <div className="sticky bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-[--navy]">
          <div className="flex items-center gap-3">
            <UserButton />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">Staff Member</div>
              <Link
                href="/"
                className="text-xs text-white/70 hover:text-white transition"
              >
                View website
              </Link>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-72">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="px-8 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {currentItem?.label || "Staff Dashboard"}
              </h2>
              <p className="text-sm text-gray-600">{currentItem?.description}</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Future: Command palette trigger (Cmd+K) */}
              <button
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md transition"
                onClick={() => {
                  // TODO: Implement command palette
                  alert("Command palette (Cmd+K) - Coming soon!");
                }}
              >
                ⌘K
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
