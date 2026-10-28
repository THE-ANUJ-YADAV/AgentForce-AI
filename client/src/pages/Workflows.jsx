import React, { useState } from 'react';
import { GitBranch, Search, Filter, ArrowRight, Clock, Plus } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';

export default function Workflows({ workflows = [], onSelectWorkflow, onOpenNewWorkflow }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredWorkflows = workflows.filter((wf) => {
    const matchesSearch =
      wf.request.toLowerCase().includes(search.toLowerCase()) ||
      wf.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || wf.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Workflows Orchestration</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            End-to-end multi-agent execution runs and autonomous business workflows
          </p>
        </div>

        <button
          onClick={onOpenNewWorkflow}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors self-start"
        >
          <Plus className="w-4 h-4" />
          <span>New Workflow</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by workflow ID or request text..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="awaiting_approval">Awaiting Approval</option>
            <option value="running">Running</option>
            <option value="partially_completed">Partially Completed</option>
            <option value="failed">Failed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Workflows List Table / Cards */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredWorkflows.length > 0 ? (
          <div className="divide-y divide-slate-200">
            {filteredWorkflows.map((wf) => {
              const completedCount = (wf.steps || []).filter((s) => s.status === 'completed').length;
              const totalCount = wf.steps?.length || 0;

              return (
                <div
                  key={wf.id}
                  onClick={() => onSelectWorkflow(wf.id)}
                  className="p-5 hover:bg-slate-50 cursor-pointer transition-colors flex items-center justify-between group"
                >
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                        {wf.id}
                      </span>
                      <StatusBadge status={wf.status} />
                      <span className="text-[11px] text-slate-400">
                        Planner: <strong className="text-slate-600 uppercase">{wf.plannerMode}</strong>
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(wf.createdAt).toLocaleTimeString()}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      "{wf.request}"
                    </h3>

                    <div className="flex items-center space-x-4 text-xs text-slate-500">
                      <span>
                        Progress: <strong className="text-slate-700">{completedCount}/{totalCount}</strong> steps completed
                      </span>
                      {wf.summary?.approvalOutcome && wf.summary.approvalOutcome !== 'none' && (
                        <span>
                          Approval: <strong className="capitalize text-slate-700">{wf.summary.approvalOutcome}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-slate-400 group-hover:text-indigo-600 transition-colors">
                    <span className="text-xs font-semibold hidden md:inline">Inspect</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center text-slate-400">
            <GitBranch className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">No workflows found</p>
            <p className="text-xs text-slate-400 mt-1">
              {workflows.length === 0
                ? 'Launch your first autonomous workflow with the button above'
                : 'No workflows match your search filters'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
