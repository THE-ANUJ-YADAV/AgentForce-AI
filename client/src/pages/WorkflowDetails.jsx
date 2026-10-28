import React, { useState } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  RotateCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  ShieldCheck,
  Send,
  Loader2,
  ExternalLink,
  Mail,
  Brain
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';

export default function WorkflowDetails({
  workflow,
  approval,
  onBack,
  onRetryStep,
  onApprove,
  onReject
}) {
  const [expandedSteps, setExpandedSteps] = useState({});
  const [retryingStepId, setRetryingStepId] = useState(null);
  const [resolvingApproval, setResolvingApproval] = useState(false);
  const [actionError, setActionError] = useState(null);

  if (!workflow) return null;

  const toggleExpand = (stepId) => {
    setExpandedSteps((prev) => ({ ...prev, [stepId]: !prev[stepId] }));
  };

  const handleRetry = async (stepId) => {
    setActionError(null);
    setRetryingStepId(stepId);
    try {
      await onRetryStep(workflow.id, stepId);
    } catch (err) {
      setActionError(err.message || 'Retry failed');
    } finally {
      setRetryingStepId(null);
    }
  };

  const handleApprove = async (approvalId) => {
    setActionError(null);
    setResolvingApproval(true);
    try {
      await onApprove(approvalId);
    } catch (err) {
      setActionError(err.message || 'Approval failed');
    } finally {
      setResolvingApproval(false);
    }
  };

  const handleReject = async (approvalId) => {
    setActionError(null);
    setResolvingApproval(true);
    try {
      await onReject(approvalId);
    } catch (err) {
      setActionError(err.message || 'Rejection failed');
    } finally {
      setResolvingApproval(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Workflows</span>
        </button>

        <div className="flex items-center space-x-3">
          <span className="text-xs font-mono font-semibold text-slate-500">ID: {workflow.id}</span>
          <StatusBadge status={workflow.status} />
        </div>
      </div>

      {actionError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Workflow Metadata Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Original Business Request
          </span>
          <h2 className="text-base font-semibold text-slate-900 leading-relaxed">
            "{workflow.request}"
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div>
            <span className="text-slate-500 block text-[11px]">Planner Engine</span>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span className="font-semibold text-slate-800 uppercase">{workflow.plannerMode}</span>
            </div>
            {workflow.plannerFallbackReason && (
              <span className="text-[10px] text-slate-400 block mt-0.5 truncate" title={workflow.plannerFallbackReason}>
                {workflow.plannerFallbackReason}
              </span>
            )}
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Created At</span>
            <span className="font-semibold text-slate-800 mt-0.5 block">
              {new Date(workflow.createdAt).toLocaleTimeString()} ({new Date(workflow.createdAt).toLocaleDateString()})
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Last Updated</span>
            <span className="font-semibold text-slate-800 mt-0.5 block">
              {new Date(workflow.updatedAt).toLocaleTimeString()}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Total Steps</span>
            <span className="font-semibold text-slate-800 mt-0.5 block">
              {workflow.steps?.length || 0} operations
            </span>
          </div>
        </div>
      </div>

      {/* Inline Approval Card if approval is pending */}
      {approval && approval.status === 'pending' && (
        <div className="bg-amber-50/60 border-2 border-amber-300 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-amber-200">
            <div className="flex items-center space-x-2.5">
              <ShieldCheck className="w-5 h-5 text-amber-600" />
              <div>
                <h3 className="text-sm font-bold text-amber-950">Human Approval Required</h3>
                <p className="text-xs text-amber-800">Action: Outbound email transmission to customer</p>
              </div>
            </div>
            <StatusBadge status="awaiting_approval" />
          </div>

          <div className="bg-white rounded-lg border border-amber-200 p-4 space-y-2.5 text-xs">
            <div className="grid grid-cols-2 gap-2 text-slate-600">
              <div>
                <span className="font-semibold text-slate-800">Recipient:</span> {approval.recipient?.name} ({approval.recipient?.email})
              </div>
              <div>
                <span className="font-semibold text-slate-800">Company:</span> {approval.recipient?.company}
              </div>
            </div>
            <div>
              <span className="font-semibold text-slate-800">Subject:</span> {approval.proposedSubject}
            </div>
            <div className="pt-2 border-t border-slate-100">
              <span className="font-semibold text-slate-800 block mb-1">Proposed Body:</span>
              <pre className="p-3 bg-slate-50 rounded-lg text-slate-700 whitespace-pre-wrap font-sans text-xs border border-slate-200 leading-relaxed">
                {approval.proposedBody}
              </pre>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-1">
            <button
              onClick={() => handleReject(approval.id)}
              disabled={resolvingApproval}
              className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              Reject Action
            </button>
            <button
              onClick={() => handleApprove(approval.id)}
              disabled={resolvingApproval}
              className="inline-flex items-center space-x-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              {resolvingApproval ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>Approve &amp; Dispatch Email (Simulated)</span>
            </button>
          </div>
        </div>
      )}

      {/* Steps Execution Pipeline */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Execution Steps Pipeline</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Individual agent actions with input/output payloads and retry capability
          </p>
        </div>

        <div className="space-y-3">
          {(workflow.steps || []).map((step, idx) => {
            const isExpanded = Boolean(expandedSteps[step.id]);
            const canRetry = step.status === 'failed' && (step.retryCount || 0) < 3;
            const isRetrying = retryingStepId === step.id;

            return (
              <div
                key={step.id}
                className={`rounded-xl border transition-all ${
                  step.status === 'failed'
                    ? 'border-rose-300 bg-rose-50/20'
                    : step.status === 'completed'
                    ? 'border-slate-200 bg-white'
                    : step.status === 'running'
                    ? 'border-indigo-300 bg-indigo-50/20'
                    : 'border-slate-200 bg-slate-50/40'
                }`}
              >
                {/* Step Row Header */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3.5">
                    <button
                      onClick={() => toggleExpand(step.id)}
                      className="p-1 hover:bg-slate-100 rounded text-slate-500 transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>

                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                      {idx + 1}
                    </span>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 text-sm">{step.agent}</span>
                        <span className="text-slate-400">→</span>
                        <span className="font-mono text-indigo-600 text-xs font-semibold">
                          {step.action}
                        </span>
                        {step.retryCount > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold border border-amber-200">
                            Retry #{step.retryCount}
                          </span>
                        )}
                      </div>
                      <div className="text-slate-500 text-xs mt-0.5">
                        {step.dependsOn?.length > 0 ? (
                          <span>Depends on: <span className="font-mono text-slate-700">{step.dependsOn.join(', ')}</span></span>
                        ) : (
                          <span>No prerequisites (runs in root tier)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <StatusBadge status={step.status} />

                    {canRetry && (
                      <button
                        onClick={() => handleRetry(step.id)}
                        disabled={isRetrying}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                      >
                        <RotateCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                        <span>Retry Step</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Error Banner if failed */}
                {step.error && (
                  <div className="mx-4 mb-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center space-x-2">
                    <XCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <div>
                      <span className="font-bold">Execution Error: </span>
                      <span>{step.error}</span>
                    </div>
                  </div>
                )}

                {/* Real Outbound Email Preview Banner if dispatched */}
                {step.output?.execution?.previewUrl && (
                  <div className="mx-4 mb-3 p-3 bg-sky-50 border border-sky-200 rounded-lg flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2 text-sky-800">
                      <Mail className="w-4 h-4 text-sky-600 shrink-0" />
                      <span>Outbound email dispatched to recipient's live mailbox!</span>
                    </div>
                    <a
                      href={step.output.execution.previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1.5 px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-md font-semibold text-xs transition-colors shadow-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Live Mailbox</span>
                    </a>
                  </div>
                )}

                {/* Expandable Step Details */}
                {isExpanded && (
                  <div className="p-4 pt-0 border-t border-slate-100 mt-2 space-y-3 bg-slate-50/50 rounded-b-xl text-xs">
                    <div>
                      <span className="font-semibold text-slate-700 uppercase tracking-wider text-[10px] block mb-1">
                        Step Parameters (Input Payload)
                      </span>
                      <pre className="p-2.5 bg-white border border-slate-200 rounded-lg font-mono text-[11px] text-slate-800 overflow-x-auto">
                        {JSON.stringify(step.params, null, 2)}
                      </pre>
                    </div>

                    {step.output && (
                      <div>
                        <span className="font-semibold text-slate-700 uppercase tracking-wider text-[10px] block mb-1">
                          Tool Output Result
                        </span>
                        <pre className="p-2.5 bg-white border border-slate-200 rounded-lg font-mono text-[11px] text-slate-800 overflow-x-auto">
                          {JSON.stringify(step.output, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Agent Cognitive Reasoning Feed */}
      {workflow.thoughts && workflow.thoughts.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-3">
          <div className="flex items-center space-x-2">
            <Brain className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Agent Cognitive Reasoning Feed</h3>
            <span className="text-[10px] text-slate-400 font-mono">({workflow.thoughts.length} deliberations)</span>
          </div>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {workflow.thoughts.map((thought, idx) => (
              <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-start space-x-2.5">
                <span className="text-[10px] text-slate-400 font-mono mt-0.5 whitespace-nowrap">
                  {new Date(thought.timestamp).toLocaleTimeString()}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                  {thought.agent}
                </span>
                <span className="text-slate-700 font-mono text-[11px] leading-relaxed">
                  {thought.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Final Workflow Summary */}
      {workflow.summary && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Executive Orchestration Summary</h3>
          <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-200 font-medium">
            {workflow.summary.outcomeText}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 text-[10px] block">Steps Succeeded</span>
              <span className="font-bold text-emerald-700 text-sm">
                {workflow.summary.completedSteps}/{workflow.summary.totalSteps}
              </span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 text-[10px] block">Steps Failed</span>
              <span className="font-bold text-rose-700 text-sm">
                {workflow.summary.failedSteps}
              </span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 text-[10px] block">Approval Outcome</span>
              <span className="font-bold text-slate-800 capitalize text-sm">
                {workflow.summary.approvalOutcome}
              </span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 text-[10px] block">Resolved Due Date</span>
              <span className="font-bold text-indigo-700 text-sm">
                {workflow.summary.resolvedDueDate || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
