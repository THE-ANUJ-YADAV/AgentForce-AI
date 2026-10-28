import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Mail,
  User,
  Building,
  Loader2,
  Clock,
  ExternalLink
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';

export default function Approvals({
  approvals = [],
  onApprove,
  onReject,
  onInspectWorkflow
}) {
  const [resolvingId, setResolvingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const handleApprove = async (id) => {
    setFeedback(null);
    setResolvingId(id);
    try {
      await onApprove(id);
      setFeedback({ type: 'success', message: 'Action approved! Simulated email dispatched to recipient.' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Approval failed' });
    } finally {
      setResolvingId(null);
    }
  };

  const handleReject = async (id) => {
    setFeedback(null);
    setResolvingId(id);
    try {
      await onReject(id);
      setFeedback({ type: 'info', message: 'Action rejected. Transmission blocked and logged.' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Rejection failed' });
    } finally {
      setResolvingId(null);
    }
  };

  const pendingApprovals = approvals.filter((a) => a.status === 'pending');
  const historyApprovals = approvals.filter((a) => a.status !== 'pending');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Human-in-the-Loop Approval Queue</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Governance gate halting autonomous execution before high-stakes outbound customer communications
        </p>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-lg text-xs flex items-center justify-between border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : feedback.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-slate-100 border-slate-300 text-slate-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedback.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {feedback.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs underline hover:no-underline font-medium ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Pending Items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
            <span>Pending Governance Decisions</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
              {pendingApprovals.length}
            </span>
          </h3>
        </div>

        {pendingApprovals.length > 0 ? (
          <div className="space-y-4">
            {pendingApprovals.map((appr) => {
              const isProcessing = resolvingId === appr.id;

              return (
                <div
                  key={appr.id}
                  className="bg-white rounded-xl border border-amber-200 shadow-sm p-6 space-y-4 ring-1 ring-amber-100"
                >
                  <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center space-x-3 mb-1">
                        <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                          {appr.id}
                        </span>
                        <StatusBadge status={appr.status} />
                        <button
                          onClick={() => onInspectWorkflow(appr.workflowId)}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium underline"
                        >
                          Workflow: {appr.workflowId}
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">
                        Reason: {appr.reason}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleReject(appr.id)}
                        disabled={isProcessing}
                        className="px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApprove(appr.id)}
                        disabled={isProcessing}
                        className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-colors"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        <span>Approve Email (Simulated)</span>
                      </button>
                    </div>
                  </div>

                  {/* Recipient info & email preview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-slate-400 shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 block">Recipient</span>
                        <span className="font-semibold text-slate-800">{appr.recipient?.name}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Building className="w-4 h-4 text-slate-400 shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 block">Company</span>
                        <span className="font-semibold text-slate-800">{appr.recipient?.company}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                      <div className="truncate">
                        <span className="text-[10px] text-slate-400 block">Target Email</span>
                        <span className="font-semibold text-slate-800 font-mono">{appr.recipient?.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-xs font-semibold text-slate-700">
                      Proposed Subject: <span className="font-normal text-slate-900">{appr.proposedSubject}</span>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-700 mb-1">Proposed Body:</div>
                      <pre className="p-3.5 bg-slate-50 rounded-lg text-slate-800 text-xs whitespace-pre-wrap font-sans border border-slate-200 leading-relaxed">
                        {appr.proposedBody}
                      </pre>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 shadow-sm">
            <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
            <p className="text-sm font-semibold text-slate-700">Approval queue is clear</p>
            <p className="text-xs text-slate-400 mt-0.5">
              No pending approval requests require human review at this time
            </p>
          </div>
        )}
      </div>

      {/* Historical Approvals */}
      {historyApprovals.length > 0 && (
        <div className="space-y-3 pt-6 border-t border-slate-200">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Decision Audit Trail ({historyApprovals.length})
          </h3>

          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 shadow-sm overflow-hidden">
            {historyApprovals.map((appr) => (
              <div key={appr.id} className="p-4 flex items-center justify-between text-xs">
                <div className="space-y-1">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono font-semibold text-slate-700">{appr.id}</span>
                    <StatusBadge status={appr.status} />
                    <span className="text-slate-500">
                      Recipient: <strong className="text-slate-700">{appr.recipient?.name}</strong> ({appr.recipient?.email})
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Reviewed by <strong className="text-slate-700">{appr.reviewer || 'System'}</strong> at{' '}
                    {appr.decisionTimestamp ? new Date(appr.decisionTimestamp).toLocaleTimeString() : 'N/A'}
                    {appr.executionResult?.action && (
                      <span className="ml-2 text-emerald-700 font-medium">
                        [{appr.executionResult.action}]
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {appr.executionResult?.previewUrl && (
                    <a
                      href={appr.executionResult.previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-xs font-semibold text-sky-700 hover:text-sky-900 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-md transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>View Outbound Email</span>
                    </a>
                  )}

                  <button
                    onClick={() => onInspectWorkflow(appr.workflowId)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    View Workflow
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
