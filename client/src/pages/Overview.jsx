import React from 'react';
import {
  GitBranch,
  CheckCircle2,
  ShieldAlert,
  AlertTriangle,
  Bot,
  CheckSquare,
  Users,
  ArrowRight,
  Clock,
  ExternalLink
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';

export default function Overview({
  workflows = [],
  approvals = [],
  tasks = [],
  crmContacts = [],
  logs = [],
  health = {},
  onSelectWorkflow,
  onNavigate
}) {
  // Aggregate Metrics derived from state
  const totalWorkflows = workflows.length;

  let totalCompletedSteps = 0;
  let totalFailedSteps = 0;
  workflows.forEach((wf) => {
    (wf.steps || []).forEach((s) => {
      if (s.status === 'completed') totalCompletedSteps++;
      if (s.status === 'failed') totalFailedSteps++;
    });
  });

  const pendingApprovals = approvals.filter((a) => a.status === 'pending').length;
  const openTasks = tasks.filter((t) => t.status === 'open' || t.status === 'in_progress').length;
  const totalContacts = crmContacts.length;
  const activeAgentsCount = (health.activeAgents || []).length;

  // Most recent running or awaiting-approval workflow (or newest workflow)
  const currentWorkflow =
    workflows.find((w) => w.status === 'running' || w.status === 'awaiting_approval') ||
    workflows[0] ||
    null;

  const statCards = [
    { label: 'Total Workflows', value: totalWorkflows, icon: GitBranch, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Completed Steps', value: totalCompletedSteps, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Pending Approvals', value: pendingApprovals, icon: ShieldAlert, color: 'text-amber-600', bg: 'bg-amber-50', highlight: pendingApprovals > 0 },
    { label: 'Failed Steps', value: totalFailedSteps, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Active Agents', value: activeAgentsCount, icon: Bot, color: 'text-sky-600', bg: 'bg-sky-50' },
    { label: 'Open Tasks', value: openTasks, icon: CheckSquare, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'CRM Contacts', value: totalContacts, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' }
  ];

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className={`bg-white rounded-xl border p-3.5 shadow-sm transition-all ${
                stat.highlight ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
                  {stat.label}
                </span>
                <div className={`w-7 h-7 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Current Execution & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Workflow Execution (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">Current Workflow Execution</h2>
              <p className="text-xs text-slate-500 mt-0.5">Live multi-agent step pipeline state</p>
            </div>
            {currentWorkflow && (
              <button
                onClick={() => onSelectWorkflow(currentWorkflow.id)}
                className="inline-flex items-center space-x-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                <span>Inspect Workflow</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {currentWorkflow ? (
            <div className="space-y-5">
              {/* Request Banner */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-mono font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                    {currentWorkflow.id}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-medium text-slate-500">
                      Planner: <span className="font-semibold text-slate-700 uppercase">{currentWorkflow.plannerMode}</span>
                    </span>
                    <StatusBadge status={currentWorkflow.status} />
                  </div>
                </div>
                <p className="text-xs text-slate-800 font-medium leading-relaxed">
                  "{currentWorkflow.request}"
                </p>
              </div>

              {/* Steps Progress */}
              <div className="space-y-3">
                <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Delegated Agent Steps ({currentWorkflow.steps?.length || 0})
                </div>

                <div className="space-y-2">
                  {(currentWorkflow.steps || []).map((step, sIdx) => (
                    <div
                      key={step.id}
                      className="p-3 rounded-lg border border-slate-200 hover:border-slate-300 bg-white flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px]">
                          {sIdx + 1}
                        </span>
                        <div>
                          <div className="font-semibold text-slate-900 flex items-center space-x-2">
                            <span>{step.agent}</span>
                            <span className="text-slate-400 font-normal">→</span>
                            <span className="font-mono text-indigo-600 text-[11px]">{step.action}</span>
                          </div>
                          <div className="text-slate-500 text-[11px] mt-0.5">
                            {step.dependsOn?.length > 0
                              ? `Depends on: ${step.dependsOn.join(', ')}`
                              : 'No prerequisite dependencies'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {step.error && (
                          <span className="text-rose-600 font-medium text-[11px] max-w-xs truncate">
                            {step.error}
                          </span>
                        )}
                        <StatusBadge status={step.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Execution Summary Quote if available */}
              {currentWorkflow.summary && (
                <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 text-xs text-indigo-900 flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">Workflow Orchestration Summary:</div>
                    <div className="text-slate-600 mt-0.5 leading-relaxed">
                      {currentWorkflow.summary.outcomeText}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400">
              <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">No active workflows</p>
              <p className="text-xs text-slate-400 mt-1">Dispatch a new business workflow to see multi-agent execution</p>
            </div>
          )}
        </div>

        {/* Recent Activity Timeline (1 col) */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Activity</h2>
              <p className="text-xs text-slate-500 mt-0.5">System-wide operational log</p>
            </div>
            <button
              onClick={() => onNavigate('logs')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              View All
            </button>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto max-h-[480px] pr-1">
            {logs.slice(0, 10).map((log) => {
              const isError = log.status === 'failed';
              const isCompleted = log.status === 'completed';
              return (
                <div key={log.id} className="flex items-start space-x-3 text-xs">
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      isError ? 'bg-rose-500' : isCompleted ? 'bg-emerald-500' : 'bg-indigo-500'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">{log.agentName}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                      {log.message}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
