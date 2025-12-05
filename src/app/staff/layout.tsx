"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
// import { UserButton } from "@clerk/nextjs"; // Temporarily disabled for dev
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
  Calendar,
  Flame,
  UserPlus,
  UsersIcon,
  Search,
  FileCode,
  Library,
  Edit,
  GitBranch,
  Activity,
  Lock,
  PlayCircle,
  TrendingUp,
  Mail,
  MessageSquare,
  Send,
} from "lucide-react";
import { useState } from "react";
import { FloatingAssistant } from "@/components/ai/FloatingAssistant";
import { ErrorBoundary, FriendlyError, TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@dykstra/ui";
import { CommandPaletteProvider } from "@/components/command-palette/CommandPaletteProvider";

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
      {
        label: "Prep Room",
        href: "/staff/prep-room",
        icon: <Flame className="w-5 h-5" />,
        description: "Preparation room scheduling",
        badge: "New",
        roles: ["funeral_director", "admin"],
      },
      {
        label: "Appointments",
        href: "/staff/appointments",
        icon: <Calendar className="w-5 h-5" />,
        description: "Pre-planning appointments",
        badge: "New",
        roles: ["funeral_director", "admin"],
      },
      {
        label: "Leads",
        href: "/staff/leads",
        icon: <UserPlus className="w-5 h-5" />,
        description: "Lead management pipeline",
        badge: "New",
        roles: ["funeral_director", "admin"],
      },
    ],
  },
  {
    label: "Finance (FinOps)",
    description: "Financial operations",
    defaultOpen: true,
    items: [
      {
        label: "Financial Dashboard",
        href: "/staff/finops/dashboard",
        icon: <BarChart3 className="w-5 h-5" />,
        description: "Overview & analytics",
        badge: "New",
        roles: ["accountant", "admin"],
      },
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
        label: "Journal Entries",
        href: "/staff/finops/journal-entry",
        icon: <FileText className="w-5 h-5" />,
        description: "Manual journal entries",
        badge: "New",
        roles: ["accountant", "admin"],
      },
      {
        label: "AR Aging",
        href: "/staff/finops/ar",
        icon: <TrendingUp className="w-5 h-5" />,
        description: "Accounts receivable aging",
        badge: "New",
        roles: ["accountant", "admin"],
      },
      {
        label: "Invoices",
        href: "/staff/finops/invoices",
        icon: <FileText className="w-5 h-5" />,
        description: "Manage AR invoices",
        badge: "New",
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
        label: "Bill Approvals",
        href: "/staff/finops/ap/approvals",
        icon: <CheckSquare className="w-5 h-5" />,
        description: "Approve vendor bills",
        badge: "New",
        roles: ["accountant", "admin"],
      },
      {
        label: "Bill Payments",
        href: "/staff/finops/ap/payments",
        icon: <DollarSign className="w-5 h-5" />,
        description: "Process bill payments",
        badge: "New",
        roles: ["accountant", "admin"],
      },
      {
        label: "Payment Run",
        href: "/staff/finops/ap/payment-run",
        icon: <PlayCircle className="w-5 h-5" />,
        description: "Batch AP payments",
        badge: "New",
        roles: ["accountant", "admin"],
      },
      {
        label: "Refunds",
        href: "/staff/finops/refunds",
        icon: <DollarSign className="w-5 h-5" />,
        description: "Process payment refunds",
        badge: "New",
        roles: ["accountant", "admin"],
      },
      {
        label: "Period Close",
        href: "/staff/finops/period-close",
        icon: <Lock className="w-5 h-5" />,
        description: "Month-end close workflow",
        badge: "New",
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
      {
        label: "Scheduling",
        href: "/staff/scheduling",
        icon: <Clock className="w-5 h-5" />,
        description: "Staff shifts & on-call",
        badge: "ERP",
        roles: ["funeral_director", "payroll_admin", "admin"],
      },
      {
        label: "HR & Employees",
        href: "/staff/hr",
        icon: <UsersIcon className="w-5 h-5" />,
        description: "Employee management",
        badge: "New",
        roles: ["payroll_admin", "admin"],
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
    label: "Documents & Templates",
    description: "Document generation & templates",
    defaultOpen: false,
    items: [
      {
        label: "Template Library",
        href: "/staff/template-library",
        icon: <Library className="w-5 h-5" />,
        description: "Browse document templates",
        roles: ["funeral_director", "admin"],
      },
      {
        label: "Template Editor",
        href: "/staff/template-editor",
        icon: <Edit className="w-5 h-5" />,
        description: "Create & edit templates",
        roles: ["funeral_director", "admin"],
      },
      {
        label: "Contract Templates",
        href: "/staff/contracts/templates",
        icon: <FileCode className="w-5 h-5" />,
        description: "Service contract templates",
        roles: ["funeral_director", "admin"],
      },
      {
        label: "Contract Builder",
        href: "/staff/contracts/builder",
        icon: <Building2 className="w-5 h-5" />,
        description: "Build custom contracts",
        roles: ["funeral_director", "admin"],
      },
      {
        label: "Template Analytics",
        href: "/staff/template-analytics",
        icon: <Activity className="w-5 h-5" />,
        description: "Template usage metrics",
        roles: ["admin"],
      },
      {
        label: "Approval Workflows",
        href: "/staff/template-approvals",
        icon: <GitBranch className="w-5 h-5" />,
        description: "Template approval process",
        roles: ["admin"],
      },
      {
        label: "Workflow Manager",
        href: "/staff/template-workflows",
        icon: <GitBranch className="w-5 h-5" />,
        description: "Manage template workflows",
        roles: ["admin"],
      },
    ],
  },
  {
    label: "Communication",
    description: "Email & SMS to families",
    defaultOpen: false,
    items: [
      {
        label: "Dashboard",
        href: "/staff/communication",
        icon: <Send className="w-5 h-5" />,
        description: "Communication hub",
        badge: "New",
        roles: ["funeral_director", "admin"],
      },
      {
        label: "Templates",
        href: "/staff/communication/templates",
        icon: <FileText className="w-5 h-5" />,
        description: "Email & SMS templates",
        badge: "New",
        roles: ["funeral_director", "admin"],
      },
      {
        label: "History",
        href: "/staff/communication/history",
        icon: <Mail className="w-5 h-5" />,
        description: "Sent messages log",
        badge: "New",
        roles: ["funeral_director", "admin"],
      },
      {
        label: "Analytics",
        href: "/staff/communication/analytics",
        icon: <BarChart3 className="w-5 h-5" />,
        description: "Performance metrics",
        badge: "New",
        roles: ["funeral_director", "admin"],
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
                      ? "text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }
                `}
                style={isActive ? { backgroundColor: '#8b9d83' } : undefined}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold" style={{ backgroundColor: '#b8956a', color: '#1e3a5f' }}>
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
    <CommandPaletteProvider>
    <TooltipProvider>
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-72 text-white fixed inset-y-0 left-0 z-50 overflow-y-auto" style={{ backgroundColor: '#1e3a5f' }}>
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
        <div className="sticky bottom-0 left-0 right-0 p-4 border-t border-white/10" style={{ backgroundColor: '#1e3a5f' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold" style={{ backgroundColor: '#8b9d83' }}>
              SM
            </div>
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
              {/* Command palette trigger (Cmd+K) with tooltip */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md transition flex items-center gap-1.5"
                    onClick={() => {
                      // Trigger keyboard event to open command palette
                      const event = new KeyboardEvent('keydown', { metaKey: true, key: 'k' });
                      document.dispatchEvent(event);
                    }}
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>⌘K</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Quick search and navigation</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">
          <ErrorBoundary
            fallback={(error, reset) => (
              <FriendlyError
                title="Oops! Something went wrong"
                message={error.message || "We encountered an unexpected error. Don't worry, we've logged it and our team is on it."}
                show={true}
                onRetry={reset}
                suggestions={[
                  { id: '1', text: 'Refresh the page', action: () => window.location.reload() },
                  { id: '2', text: 'Go back to dashboard', action: () => window.location.href = '/staff/dashboard' },
                  { id: '3', text: 'Contact support if the problem persists' },
                ]}
              />
            )}
          >
            {children}
          </ErrorBoundary>
        </div>
      </main>
      
      {/* Floating AI Assistant */}
      <FloatingAssistant />
    </div>
    </TooltipProvider>
    </CommandPaletteProvider>
  );
}
