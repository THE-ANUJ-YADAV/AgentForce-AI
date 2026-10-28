import React from 'react';
import {
  Brain,
  Shield,
  Users,
  CalendarCheck,
  Mail,
  Wrench,
  CheckCircle2,
  XCircle,
  Activity
} from 'lucide-react';

export default function Workforce({ workflows = [], health = {} }) {
  const activeAgents = health.activeAgents || [];

  // Calculate real completed/failed step counts per agent from actual application state
  const agentStats = {
    'Planner Agent': { completed: 0, failed: 0 },
    'Supervisor': { completed: 0, failed: 0 },
    'CRM Agent': { completed: 0, failed: 0 },
    'Task Agent': { completed: 0, failed: 0 },
    'Email Agent': { completed: 0, failed: 0 }
  };

  workflows.forEach((wf) => {
    // Planner operates on each workflow
    if (wf.plan?.length > 0) {
      agentStats['Planner Agent'].completed++;
    }
    (wf.steps || []).forEach((step) => {
      const agentKey = step.agent;
      if (agentStats[agentKey]) {
        if (step.status === 'completed') agentStats[agentKey].completed++;
        if (step.status === 'failed') agentStats[agentKey].failed++;
      }
    });
  });

  const agents = [
    {
      name: 'Planner Agent',
      role: 'Strategic Planning & Goal Decomposition',
      icon: Brain,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      responsibilities: [
        'Analyze natural language business outcome requests',
        'Extract entities: contacts, companies, dates, priorities, purposes',
        'Map requests strictly to authorized multi-agent schema',
        'Enforce step dependency hierarchy with automatic fallback'
      ],
      tools: ['callGemini', 'validatePlan', 'planWithFallback']
    },
    {
      name: 'Supervisor',
      role: 'Workforce Orchestrator & Governance',
      icon: Shield,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      responsibilities: [
        'Coordinate workflow lifecycle across all specialized workers',
        'Enforce step dependency constraints and block cascade failures',
        'Enforce human-in-the-loop approval gate for sensitive actions',
        'Aggregate metrics, manage isolated retries and compile summaries'
      ],
      tools: ['requestApproval', 'executeApprovedAction', 'retryStep', 'writeActivityLog']
    },
    {
      name: 'CRM Agent',
      role: 'Customer Relationship & Lead Intelligence',
      icon: Users,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      responsibilities: [
        'Search existing CRM records by email or name/company',
        'Prevent duplicate records across all business workflows',
        'Calculate deterministic lead scores and track engagement',
        'Sync enterprise customer profiles with workflow context'
      ],
      tools: ['findContact', 'createContact', 'updateContact']
    },
    {
      name: 'Task Agent',
      role: 'Workforce Operations & Task Scheduling',
      icon: CalendarCheck,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      responsibilities: [
        'Resolve relative business date phrases into strict IST dates',
        'Schedule follow-up tasks linked to CRM contacts',
        'Assign operational task priorities (Low, Medium, High)',
        'Track and report task execution status'
      ],
      tools: ['createTask', 'resolveDate']
    },
    {
      name: 'Email Agent',
      role: 'Communications & Outbound Messaging',
      icon: Mail,
      color: 'text-sky-600 bg-sky-50 border-sky-200',
      responsibilities: [
        'Synthesize CRM data to compose personalized email drafts',
        'Use Gemini models with fallback to deterministic templates',
        'Address recipients and reference companies accurately',
        'Stage drafts for human verification before simulated dispatch'
      ],
      tools: ['generateEmailDraft', 'callGemini']
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Autonomous Workforce Architecture</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Five specialized AI agents collaborating synchronously with discrete responsibilities and tool privileges
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {agents.map((agent) => {
          const Icon = agent.icon;
          const isRunning = activeAgents.includes(agent.name);
          const stats = agentStats[agent.name] || { completed: 0, failed: 0 };

          return (
            <div
              key={agent.name}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all"
            >
              <div>
                {/* Agent Header */}
                <div className="flex items-start justify-between mb-3.5">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${agent.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{agent.name}</h3>
                      <p className="text-[11px] font-medium text-slate-500">{agent.role}</p>
                    </div>
                  </div>

                  {/* Status Pill */}
                  <div>
                    {isRunning ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse">
                        <Activity className="w-3 h-3 text-indigo-600" />
                        <span>Running</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        <span>Idle</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 mb-4 text-xs">
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <div>
                      <span className="text-slate-500 text-[10px] block">Completed</span>
                      <span className="font-bold text-slate-900">{stats.completed}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <div>
                      <span className="text-slate-500 text-[10px] block">Failed</span>
                      <span className="font-bold text-slate-900">{stats.failed}</span>
                    </div>
                  </div>
                </div>

                {/* Core Responsibilities */}
                <div className="mb-4">
                  <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-2">
                    Core Responsibilities
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-600">
                    {agent.responsibilities.map((r, i) => (
                      <li key={i} className="flex items-start space-x-2 leading-relaxed">
                        <span className="text-indigo-500 font-bold">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Authorized Tools */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  <Wrench className="w-3 h-3 text-slate-400" />
                  <span>Authorized Executable Tools</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {agent.tools.map((tool) => (
                    <span
                      key={tool}
                      className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200"
                    >
                      {tool}()
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
