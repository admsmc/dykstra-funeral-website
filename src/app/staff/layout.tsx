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
} from "lucide-react";

/**
 * Staff Dashboard Layout
 * Protected layout for funeral home staff
 *
 * Features:
 * - Left sidebar navigation
 * - Desktop-first, data-dense design
 * - Role-based access control
 */

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  description: string;
}

const navigation: NavItem[] = [
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
    label: "Payments",
    href: "/staff/payments",
    icon: <DollarSign className="w-5 h-5" />,
    description: "Payment processing",
  },
  {
    label: "Analytics",
    href: "/staff/analytics",
    icon: <BarChart3 className="w-5 h-5" />,
    description: "Reports and insights",
  },
  {
    label: "Tasks",
    href: "/staff/tasks",
    icon: <CheckSquare className="w-5 h-5" />,
    description: "Task management",
  },
  {
    label: "Families",
    href: "/staff/families",
    icon: <Users className="w-5 h-5" />,
    description: "Family invitations",
  },
];

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-[--navy] text-white fixed inset-y-0 left-0 z-50">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <h1 className="text-xl font-serif">Dykstra Funeral Home</h1>
          <p className="text-sm text-white/70 mt-1">Staff Portal</p>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");

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
                  <div className="font-medium text-sm">{item.label}</div>
                  <div className="text-xs opacity-70 truncate">
                    {item.description}
                  </div>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User section at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
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
      <main className="flex-1 ml-64">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="px-8 py-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {navigation.find((item) => pathname === item.href || pathname?.startsWith(item.href + "/"))?.label ||
                "Staff Dashboard"}
            </h2>
            <div className="flex items-center gap-4">
              {/* Could add search, notifications, etc. */}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
