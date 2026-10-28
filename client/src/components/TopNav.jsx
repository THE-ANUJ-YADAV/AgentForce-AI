import React from 'react';
import { Plus, Activity, CheckCircle2, AlertCircle } from 'lucide-react';

export default function TopNav({
  title,
  backendConnected,
  activeAgents = [],
  onOpenNewWorkflow
}) {
  const isAgentActive = activeAgents.length > 0;
  const currentAgentName = isAgentActive ? activeAgents[0] : 'Idle';

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center space-x-5">
        {/* Active Agent Indicator */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 text-xs">
          <Activity
            className={`w-3.5 h-3.5 ${
              isAgentActive ? 'text-indigo-600 animate-pulse' : 'text-slate-400'
            }`}
          />
          <span className="text-slate-500 font-medium">Workforce:</span>
          <span
            className={`font-semibold ${
              isAgentActive ? 'text-indigo-600' : 'text-slate-700'
            }`}
          >
            {isAgentActive ? `${currentAgentName} (Busy)` : 'Idle'}
          </span>
        </div>

        {/* Backend Connectivity Status */}
        <div className="flex items-center space-x-2 text-xs">
          {backendConnected ? (
            <div className="flex items-center space-x-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Backend Connected</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full font-medium">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>Backend Unreachable</span>
            </div>
          )}
        </div>

        {/* New Workflow Trigger Button */}
        <button
          onClick={onOpenNewWorkflow}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Workflow</span>
        </button>
      </div>
    </header>
  );
}
