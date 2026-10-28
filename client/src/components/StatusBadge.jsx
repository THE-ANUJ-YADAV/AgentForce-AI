import React from 'react';
import {
  Clock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ShieldAlert,
  Ban
} from 'lucide-react';

export default function StatusBadge({ status }) {
  const norm = (status || '').toLowerCase();

  switch (norm) {
    case 'completed':
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>Completed</span>
        </span>
      );

    case 'running':
    case 'in_progress':
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <Loader2 className="w-3 h-3 text-indigo-600 animate-spin" />
          <span>{norm === 'in_progress' ? 'In Progress' : 'Running'}</span>
        </span>
      );

    case 'awaiting_approval':
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300">
          <ShieldAlert className="w-3 h-3 text-amber-600 animate-pulse" />
          <span>Awaiting Approval</span>
        </span>
      );

    case 'partially_completed':
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          <AlertCircle className="w-3 h-3 text-amber-600" />
          <span>Partially Completed</span>
        </span>
      );

    case 'failed':
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3 h-3 text-rose-600" />
          <span>Failed</span>
        </span>
      );

    case 'rejected':
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
          <Ban className="w-3 h-3 text-slate-500" />
          <span>Rejected</span>
        </span>
      );

    case 'blocked':
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
          <Ban className="w-3 h-3 text-orange-500" />
          <span>Blocked</span>
        </span>
      );

    case 'open':
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
          <Clock className="w-3 h-3 text-sky-500" />
          <span>Open</span>
        </span>
      );

    case 'pending':
    default:
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>Pending</span>
        </span>
      );
  }
}
