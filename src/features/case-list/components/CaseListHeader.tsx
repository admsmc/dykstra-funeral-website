/**
 * Case List Header Component
 */

import Link from "next/link";
import { Plus } from "lucide-react";

export function CaseListHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cases</h1>
        <p className="text-gray-600 mt-1">Manage all funeral cases</p>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs text-gray-500">
          Press{" "}
          <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded">
            N
          </kbd>{" "}
          for new case
        </span>
        <Link
          href="/staff/cases/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[--navy] text-white rounded-lg hover:bg-[--sage] transition font-medium"
        >
          <Plus className="w-5 h-5" />
          Create Case
        </Link>
      </div>
    </div>
  );
}
