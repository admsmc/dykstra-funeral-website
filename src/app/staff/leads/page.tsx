'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Phone, Mail, Calendar, ArrowRight, Plus, Search, Filter, Loader2 } from 'lucide-react';
import { api } from '@/trpc/react';
import { toast } from 'sonner';
import NewLeadModal from './_components/NewLeadModal';

/**
 * Lead Management Page - Linear/Notion Style
 * Kanban pipeline for lead tracking and conversion
 * 
 * Features:
 * - Kanban pipeline (New, Contacted, Qualified, Converted)
 * - Lead creation and qualification
 * - Lead-to-case conversion workflow
 * - Contact information tracking
 * - Source tracking
 */

interface Lead {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted';
  createdDate: string;
  notes?: string;
}

const STATUSES = [
  { key: 'new', label: 'New Leads', color: 'indigo' },
  { key: 'contacted', label: 'Contacted', color: 'blue' },
  { key: 'qualified', label: 'Qualified', color: 'amber' },
  { key: 'converted', label: 'Converted', color: 'green' },
] as const;

export default function LeadsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);

  // Fetch leads from API
  const { data: leadsData, isLoading, error, refetch } = api.lead.list.useQuery({});
  
  // Map API data to UI format
  const allLeads: Lead[] = (leadsData?.items || []).map((lead: any) => ({
    id: lead.id,
    name: `${lead.firstName} ${lead.lastName}`,
    contact: `${lead.firstName} ${lead.lastName}`,
    phone: lead.phone || 'N/A',
    email: lead.email || 'N/A',
    source: lead.source.charAt(0).toUpperCase() + lead.source.slice(1).replace('_', ' '),
    status: lead.status as any,
    createdDate: new Date(lead.createdAt).toISOString().split('T')[0],
  }));

  const filteredLeads = allLeads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         lead.contact.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter;
    return matchesSearch && matchesSource;
  });

  const totalLeads = allLeads.length;
  const newLeads = allLeads.filter(l => l.status === 'new').length;
  const qualifiedLeads = allLeads.filter(l => l.status === 'qualified').length;
  const convertedLeads = allLeads.filter(l => l.status === 'converted').length;

  const sources = Array.from(new Set(allLeads.map(l => l.source)));

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-4xl font-bold text-gray-900">Lead Management</h1>
        <p className="text-lg text-gray-600">Track and convert leads through the sales pipeline</p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard icon={Users} label="Total Leads" value={totalLeads.toString()} color="indigo" delay={0} />
        <StatsCard icon={Phone} label="New Leads" value={newLeads.toString()} color="blue" delay={0.1} />
        <StatsCard icon={Calendar} label="Qualified" value={qualifiedLeads.toString()} color="amber" delay={0.2} />
        <StatsCard icon={ArrowRight} label="Converted" value={convertedLeads.toString()} color="green" delay={0.3} />
      </div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-80 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Sources</option>
            {sources.map(source => (
              <option key={source} value={source}>{source}</option>
            ))}
          </select>
        </div>

        <button 
          onClick={() => setIsNewLeadModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          New Lead
        </button>
      </motion.div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="ml-3 text-gray-600">Loading leads...</p>
        </div>
      )}
      
      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <p className="font-medium">Error loading leads</p>
          <p className="text-sm">{error.message}</p>
        </div>
      )}

      {/* Kanban Pipeline */}
      {!isLoading && !error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-4 gap-4"
        >
          {STATUSES.map((status, statusIndex) => (
            <LeadColumn
              key={status.key}
              status={status}
              leads={filteredLeads.filter(l => l.status === status.key)}
              delay={0.55 + statusIndex * 0.05}
            />
          ))}
        </motion.div>
      )}
      
      {/* New Lead Modal */}
      <NewLeadModal
        isOpen={isNewLeadModalOpen}
        onClose={() => setIsNewLeadModalOpen(false)}
        onSuccess={() => {
          refetch();
          setIsNewLeadModalOpen(false);
        }}
      />
    </div>
  );
}

function StatsCard({ icon: Icon, label, value, color, delay }: any) {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    green: 'bg-green-50 text-green-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6"
    >
      <div className="flex justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
}

function LeadColumn({ status, leads, delay }: any) {
  const getColumnColor = (color: string) => {
    switch (color) {
      case 'indigo': return 'bg-indigo-50 border-indigo-200';
      case 'blue': return 'bg-blue-50 border-blue-200';
      case 'amber': return 'bg-amber-50 border-amber-200';
      case 'green': return 'bg-green-50 border-green-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getColumnTextColor = (color: string) => {
    switch (color) {
      case 'indigo': return 'text-indigo-900';
      case 'blue': return 'text-blue-900';
      case 'amber': return 'text-amber-900';
      case 'green': return 'text-green-900';
      default: return 'text-gray-900';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="space-y-3"
    >
      <div className={`flex items-center justify-between px-4 py-3 rounded-lg border ${getColumnColor(status.color)}`}>
        <h3 className={`font-semibold ${getColumnTextColor(status.color)}`}>{status.label}</h3>
        <span className={`text-sm font-medium px-2 py-1 rounded ${getColumnTextColor(status.color)} bg-white/50`}>
          {leads.length}
        </span>
      </div>

      <div className="space-y-3 min-h-[600px]">
        {leads.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            No leads
          </div>
        ) : (
          leads.map((lead: Lead, index: number) => (
            <LeadCard key={lead.id} lead={lead} status={status.key} index={index} />
          ))
        )}
      </div>
    </motion.div>
  );
}

function LeadCard({ lead, status, index }: { lead: Lead; status: string; index: number }) {
  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'Website': return 'bg-purple-100 text-purple-800';
      case 'Phone': return 'bg-blue-100 text-blue-800';
      case 'Referral': return 'bg-green-100 text-green-800';
      case 'Walk-in': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionButton = () => {
    switch (status) {
      case 'new':
        return (
          <button className="w-full px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            Contact
          </button>
        );
      case 'contacted':
        return (
          <button className="w-full px-3 py-1.5 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition">
            Qualify
          </button>
        );
      case 'qualified':
        return (
          <button className="w-full px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
            Convert to Case
          </button>
        );
      case 'converted':
        return (
          <button className="w-full px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
            View Case
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02 }}
      className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition"
    >
      <div className="space-y-3">
        <div>
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-semibold text-gray-900">{lead.name}</h4>
            <span className={`text-xs px-2 py-1 rounded font-medium ${getSourceBadge(lead.source)}`}>
              {lead.source}
            </span>
          </div>
          <p className="text-sm text-gray-600">{lead.contact}</p>
        </div>

        <div className="space-y-1 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Phone className="w-3 h-3" />
            {lead.phone}
          </div>
          <div className="flex items-center gap-1">
            <Mail className="w-3 h-3" />
            <span className="truncate">{lead.email}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(lead.createdDate).toLocaleDateString()}
          </div>
        </div>

        {lead.notes && (
          <div className="text-xs text-gray-600 bg-gray-50 rounded p-2">
            {lead.notes}
          </div>
        )}

        <div className="pt-2">
          {getActionButton()}
        </div>
      </div>
    </motion.div>
  );
}
