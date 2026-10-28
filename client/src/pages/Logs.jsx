import React, { useState } from 'react';
import {
  ScrollText,
  Search,
  Filter,
  Copy,
  Check,
  X,
  FileJson,
  Calendar,
  Activity
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';

export default function Logs({ logs = [] }) {
  const [search, setSearch] = useState('');
  const [agentFilter, setAgentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState(null);
  const [copied, setCopied] = useState(false);

  const filteredLogs = logs.filter((l) => {
    const q = search.toLowerCase();
    const matchesSearch =
      l.message.toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q) ||
      (l.workflowId || '').toLowerCase().includes(q) ||
      l.agentName.toLowerCase().includes(q);

    const matchesAgent = agentFilter === 'ALL' || l.agentName === agentFilter;
    const matchesStatus = statusFilter === 'ALL' || l.status === statusFilter;

    return matchesSearch && matchesAgent && matchesStatus;
  });

  const handleCopyJson = (item) => {
    navigator.clipboard.writeText(JSON.stringify(item, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Activity Logs &amp; Audit Trail</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Deterministic execution history across multi-agent state machines and tool calls
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by action, message, or workflow..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="flex items-center space-x-1.5">
            <span className="text-xs text-slate-500">Agent:</span>
            <select
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Agents</option>
              <option value="Planner Agent">Planner Agent</option>
              <option value="Supervisor">Supervisor</option>
              <option value="CRM Agent">CRM Agent</option>
              <option value="Task Agent">Task Agent</option>
              <option value="Email Agent">Email Agent</option>
              <option value="System">System</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-xs text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="info">Info</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Workflow</th>
                  <th className="py-3 px-4">Agent</th>
                  <th className="py-3 px-4">Action &amp; Tool</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Message</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => {
                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px]">
                        {log.workflowId ? (
                          <span className="text-indigo-600 font-semibold">{log.workflowId}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                        {log.agentName}
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px]">
                        <span className="text-slate-800">{log.action}</span>
                        {log.toolName !== 'none' && (
                          <span className="text-slate-400 block text-[10px]">{log.toolName}()</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <StatusBadge status={log.status} />
                      </td>

                      <td className="py-3 px-4 text-slate-700 max-w-md">
                        <p className="line-clamp-2 leading-relaxed">{log.message}</p>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-400">
            <ScrollText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">No activity logs recorded</p>
            <p className="text-xs text-slate-400 mt-1">Actions performed by agents will be logged here</p>
          </div>
        )}
      </div>

      {/* Log Details Modal / Drawer */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2.5">
                <FileJson className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Structured Log Entry</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 text-slate-600">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Timestamp</span>
                  <span className="font-mono text-slate-800">{selectedLog.timestamp}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Agent</span>
                  <span className="font-semibold text-slate-800">{selectedLog.agentName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Action</span>
                  <span className="font-mono text-slate-800">{selectedLog.action}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Status</span>
                  <StatusBadge status={selectedLog.status} />
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Message</span>
                <p className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 leading-relaxed">
                  {selectedLog.message}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Structured JSON Payload</span>
                  <button
                    onClick={() => handleCopyJson(selectedLog)}
                    className="inline-flex items-center space-x-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy JSON</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg font-mono text-[11px] max-h-60 overflow-y-auto">
                  {JSON.stringify(selectedLog, null, 2)}
                </pre>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
