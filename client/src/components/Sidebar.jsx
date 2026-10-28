import React from 'react';
import {
  LayoutDashboard,
  Bot,
  GitBranch,
  CheckSquare,
  Users,
  ShieldCheck,
  ScrollText,
  Settings,
  Sparkles
} from 'lucide-react';

export default function Sidebar({ currentPage, setCurrentPage, pendingApprovalsCount = 0 }) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'workforce', label: 'AI Workforce', icon: Bot },
    { id: 'workflows', label: 'Workflows', icon: GitBranch },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'crm', label: 'CRM & Leads', icon: Users },
    {
      id: 'approvals',
      label: 'Approval Queue',
      icon: ShieldCheck,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : null
    },
    { id: 'logs', label: 'Activity Logs', icon: ScrollText },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="h-16 px-6 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-slate-900 leading-none text-base">AgentForce AI</div>
            <div className="text-[11px] font-medium text-slate-500 mt-1 uppercase tracking-wider">Enterprise Workforce</div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="p-4 space-y-1.5 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/50">
        <div className="text-xs text-slate-500 font-medium">AgentForce Autonomous v1.0</div>
        <div className="text-[11px] text-slate-400 mt-0.5">5 Specialized AI Agents Active</div>
      </div>
    </aside>
  );
}
