'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
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
  Plus,
  Search,
  Calendar,
} from 'lucide-react';
import './command-palette.css';

/**
 * Command Palette Component
 * Linear/Notion-style ⌘K quick navigation
 */

interface Command {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  group: string;
  keywords?: string[];
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');

  // Define all commands
  const commands: Command[] = [
    // Quick Actions
    {
      id: 'new-case',
      label: 'New Case',
      description: 'Create a new funeral case',
      icon: <Plus className="w-4 h-4" />,
      action: () => router.push('/staff/cases/new'),
      group: 'Quick Actions',
      keywords: ['create', 'add', 'funeral'],
    },
    {
      id: 'record-payment',
      label: 'Record Payment',
      description: 'Record a manual payment',
      icon: <DollarSign className="w-4 h-4" />,
      action: () => router.push('/staff/payments'),
      group: 'Quick Actions',
      keywords: ['cash', 'check', 'payment'],
    },
    {
      id: 'new-contract',
      label: 'New Contract',
      description: 'Create a service contract',
      icon: <FileText className="w-4 h-4" />,
      action: () => router.push('/staff/contracts/new'),
      group: 'Quick Actions',
      keywords: ['agreement', 'service'],
    },

    // Navigation - Operations
    {
      id: 'dashboard',
      label: 'Dashboard',
      description: 'Overview and KPIs',
      icon: <LayoutDashboard className="w-4 h-4" />,
      action: () => router.push('/staff/dashboard'),
      group: 'Navigation',
      keywords: ['home', 'overview'],
    },
    {
      id: 'cases',
      label: 'Cases',
      description: 'Manage funeral cases',
      icon: <FolderOpen className="w-4 h-4" />,
      action: () => router.push('/staff/cases'),
      group: 'Navigation',
      keywords: ['funeral', 'decedent'],
    },
    {
      id: 'contracts',
      label: 'Contracts',
      description: 'Service agreements',
      icon: <FileText className="w-4 h-4" />,
      action: () => router.push('/staff/contracts'),
      group: 'Navigation',
      keywords: ['agreement', 'service'],
    },
    {
      id: 'families',
      label: 'Families',
      description: 'Family portal access',
      icon: <Users className="w-4 h-4" />,
      action: () => router.push('/staff/families'),
      group: 'Navigation',
      keywords: ['portal', 'invitation'],
    },
    {
      id: 'tasks',
      label: 'Tasks',
      description: 'Task management',
      icon: <CheckSquare className="w-4 h-4" />,
      action: () => router.push('/staff/tasks'),
      group: 'Navigation',
      keywords: ['todo', 'checklist'],
    },

    // Navigation - Finance
    {
      id: 'payments',
      label: 'Payments',
      description: 'Payment processing',
      icon: <DollarSign className="w-4 h-4" />,
      action: () => router.push('/staff/payments'),
      group: 'Finance',
      keywords: ['billing', 'invoice'],
    },
    {
      id: 'finops',
      label: 'General Ledger',
      description: 'Financial operations',
      icon: <Calculator className="w-4 h-4" />,
      action: () => router.push('/staff/finops'),
      group: 'Finance',
      keywords: ['gl', 'accounting'],
    },
    {
      id: 'ap',
      label: 'Accounts Payable',
      description: 'AP invoices & bills',
      icon: <Wallet className="w-4 h-4" />,
      action: () => router.push('/staff/finops/ap'),
      group: 'Finance',
      keywords: ['bills', 'vendor', 'payable'],
    },
    {
      id: 'analytics',
      label: 'Analytics',
      description: 'Reports and insights',
      icon: <BarChart3 className="w-4 h-4" />,
      action: () => router.push('/staff/analytics'),
      group: 'Finance',
      keywords: ['reports', 'dashboard', 'metrics'],
    },

    // Navigation - HR & Payroll
    {
      id: 'payroll',
      label: 'Payroll',
      description: 'Payroll processing',
      icon: <Clock className="w-4 h-4" />,
      action: () => router.push('/staff/payroll'),
      group: 'HR & Payroll',
      keywords: ['salary', 'wages'],
    },
    {
      id: 'time-tracking',
      label: 'Time Tracking',
      description: 'Employee time entries',
      icon: <Clock className="w-4 h-4" />,
      action: () => router.push('/staff/payroll/time'),
      group: 'HR & Payroll',
      keywords: ['timesheet', 'hours'],
    },
    {
      id: 'scheduling',
      label: 'Staff Scheduling',
      description: 'Shifts & on-call rotation',
      icon: <Calendar className="w-4 h-4" />,
      action: () => router.push('/staff/scheduling'),
      group: 'HR & Payroll',
      keywords: ['roster', 'shifts', 'rotation', 'on-call'],
    },

    // Navigation - Procurement
    {
      id: 'procurement',
      label: 'Purchase Orders',
      description: 'PO management',
      icon: <FileText className="w-4 h-4" />,
      action: () => router.push('/staff/procurement'),
      group: 'Procurement',
      keywords: ['po', 'purchase', 'order'],
    },
    {
      id: 'inventory',
      label: 'Inventory',
      description: 'Stock and supplies',
      icon: <Package className="w-4 h-4" />,
      action: () => router.push('/staff/inventory'),
      group: 'Procurement',
      keywords: ['stock', 'supplies', 'caskets'],
    },
    {
      id: 'suppliers',
      label: 'Suppliers',
      description: 'Vendor management',
      icon: <Building2 className="w-4 h-4" />,
      action: () => router.push('/staff/procurement/suppliers'),
      group: 'Procurement',
      keywords: ['vendor', 'supplier'],
    },

    // Navigation - Logistics
    {
      id: 'shipments',
      label: 'Shipments',
      description: 'Track deliveries',
      icon: <TruckIcon className="w-4 h-4" />,
      action: () => router.push('/staff/scm'),
      group: 'Logistics',
      keywords: ['delivery', 'tracking', 'shipping'],
    },

    // Recent Items
    {
      id: 'recent-cases',
      label: 'View Recent Cases',
      description: 'Last 10 cases modified',
      icon: <Clock className="w-4 h-4" />,
      action: () => router.push('/staff/cases?sort=recent'),
      group: 'Recent',
      keywords: ['recent', 'last', 'latest'],
    },
    {
      id: 'recent-payments',
      label: 'View Recent Payments',
      description: 'Last 10 payments recorded',
      icon: <DollarSign className="w-4 h-4" />,
      action: () => router.push('/staff/payments?sort=recent'),
      group: 'Recent',
      keywords: ['recent', 'last', 'latest'],
    },

    // Reports & Analytics
    {
      id: 'financial-reports',
      label: 'Financial Reports',
      description: 'Revenue and expense reports',
      icon: <BarChart3 className="w-4 h-4" />,
      action: () => router.push('/staff/analytics?tab=financial'),
      group: 'Reports',
      keywords: ['report', 'revenue', 'expense'],
    },
    {
      id: 'case-reports',
      label: 'Case Reports',
      description: 'Case volume and metrics',
      icon: <FolderOpen className="w-4 h-4" />,
      action: () => router.push('/staff/analytics?tab=cases'),
      group: 'Reports',
      keywords: ['report', 'metrics', 'statistics'],
    },

    // Settings & Tools
    {
      id: 'new-family',
      label: 'Invite Family',
      description: 'Send portal invitation',
      icon: <Users className="w-4 h-4" />,
      action: () => router.push('/staff/families?action=invite'),
      group: 'Quick Actions',
      keywords: ['invite', 'portal', 'family'],
    },
    {
      id: 'new-task',
      label: 'Create Task',
      description: 'Add a new task',
      icon: <CheckSquare className="w-4 h-4" />,
      action: () => router.push('/staff/tasks?action=new'),
      group: 'Quick Actions',
      keywords: ['todo', 'task', 'reminder'],
    },
    {
      id: 'inventory-low',
      label: 'Low Stock Items',
      description: 'View items needing reorder',
      icon: <Package className="w-4 h-4" />,
      action: () => router.push('/staff/inventory?filter=low'),
      group: 'Inventory',
      keywords: ['low', 'reorder', 'stock'],
    },
    {
      id: 'inventory-transfer',
      label: 'Transfer Inventory',
      description: 'Move stock between locations',
      icon: <TruckIcon className="w-4 h-4" />,
      action: () => router.push('/staff/inventory?action=transfer'),
      group: 'Inventory',
      keywords: ['transfer', 'move', 'location'],
    },
    {
      id: 'new-supplier',
      label: 'Add Supplier',
      description: 'Create new vendor',
      icon: <Building2 className="w-4 h-4" />,
      action: () => router.push('/staff/procurement/suppliers?action=new'),
      group: 'Procurement',
      keywords: ['vendor', 'supplier', 'new'],
    },
    {
      id: 'pending-approvals',
      label: 'Pending Approvals',
      description: 'Timesheets awaiting approval',
      icon: <Clock className="w-4 h-4" />,
      action: () => router.push('/staff/payroll/time?filter=pending'),
      group: 'HR & Payroll',
      keywords: ['approve', 'pending', 'timesheet'],
    },
    {
      id: 'overdue-invoices',
      label: 'Overdue Invoices',
      description: 'Bills past due date',
      icon: <Wallet className="w-4 h-4" />,
      action: () => router.push('/staff/finops/ap?filter=overdue'),
      group: 'Finance',
      keywords: ['overdue', 'late', 'due'],
    },
    {
      id: 'search-cases',
      label: 'Search All Cases',
      description: 'Find by name or case number',
      icon: <Search className="w-4 h-4" />,
      action: () => router.push('/staff/cases?focus=search'),
      group: 'Navigation',
      keywords: ['find', 'search', 'lookup'],
    },
    {
      id: 'help-docs',
      label: 'Help & Documentation',
      description: 'User guides and support',
      icon: <FileText className="w-4 h-4" />,
      action: () => window.open('/help', '_blank'),
      group: 'Settings',
      keywords: ['help', 'support', 'docs', 'guide'],
    },
  ];

  // Filter commands based on search
  const filteredCommands = search
    ? commands.filter((cmd) => {
        const searchLower = search.toLowerCase();
        return (
          cmd.label.toLowerCase().includes(searchLower) ||
          cmd.description?.toLowerCase().includes(searchLower) ||
          cmd.keywords?.some((k) => k.toLowerCase().includes(searchLower))
        );
      })
    : commands;

  // Group filtered commands
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.group]) acc[cmd.group] = [];
    acc[cmd.group].push(cmd);
    return acc;
  }, {} as Record<string, Command[]>);

  // Handle command selection
  const handleSelect = useCallback(
    (commandId: string) => {
      const command = commands.find((c) => c.id === commandId);
      if (command) {
        command.action();
        onOpenChange(false);
        setSearch('');
      }
    },
    [commands, onOpenChange]
  );

  // Close on Escape
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onOpenChange(false);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [onOpenChange]);

  if (!open) return null;

  return (
    <div className="command-palette-overlay">
      <Command.Dialog
        open={open}
        onOpenChange={onOpenChange}
        label="Command Menu"
        className="command-palette"
      >
        <div className="command-palette-header">
          <Search className="w-5 h-5 text-gray-400" />
          <Command.Input
            value={search}
            onValueChange={setSearch}
            placeholder="Type a command or search..."
            className="command-palette-input"
          />
        </div>

        <Command.List className="command-palette-list">
          <Command.Empty className="command-palette-empty">
            No results found for "{search}"
          </Command.Empty>

          {Object.entries(groupedCommands).map(([group, cmds]) => (
            <Command.Group key={group} heading={group} className="command-palette-group">
              {cmds.map((cmd) => (
                <Command.Item
                  key={cmd.id}
                  value={cmd.id}
                  onSelect={handleSelect}
                  className="command-palette-item"
                >
                  <div className="command-palette-item-icon">{cmd.icon}</div>
                  <div className="command-palette-item-content">
                    <div className="command-palette-item-label">{cmd.label}</div>
                    {cmd.description && (
                      <div className="command-palette-item-description">{cmd.description}</div>
                    )}
                  </div>
                </Command.Item>
              ))}
            </Command.Group>
          ))}
        </Command.List>
      </Command.Dialog>
    </div>
  );
}
