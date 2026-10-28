import React, { useState } from 'react';
import { X, Sparkles, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';

export default function NewWorkflowModal({ isOpen, onClose, onSubmit }) {
  const [requestText, setRequestText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const EXAMPLE_RAHUL =
    'Add Rahul Sharma from ABC Technologies to CRM, create a follow-up task for Friday, and prepare a personalized product demo email.';

  const EXAMPLE_FAIL =
    'Add Test User from FailCorp (fail@test.com) to CRM, create a follow-up task for Friday, and prepare a product demo email.';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!requestText.trim() || requestText.trim().length < 10) {
      setError('Business request must be at least 10 characters.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onSubmit(requestText.trim());
      setRequestText('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to dispatch workflow.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Dispatch Autonomous Workflow</h2>
              <p className="text-xs text-slate-500">Autonomous planning, CRM, Task scheduling & Outbound approval</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Natural Language Request
            </label>
            <textarea
              rows={4}
              value={requestText}
              onChange={(e) => {
                setRequestText(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Add Rahul Sharma from ABC Technologies to CRM, create a follow-up task for Friday, and prepare a personalized product demo email."
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-slate-900 placeholder-slate-400"
            />
            <div className="flex justify-between items-center mt-1.5 text-xs text-slate-400">
              <span>Enter a natural language business command</span>
              <span>{requestText.length}/1000</span>
            </div>
          </div>

          {/* Quick Demo Templates */}
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              One-Click Demo Requests
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setRequestText(EXAMPLE_RAHUL)}
                className="text-left p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600">
                    Rahul Sharma (Happy Path)
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  Add Rahul Sharma, create follow-up task for Friday, draft demo email and gate with approval.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setRequestText(EXAMPLE_FAIL)}
                className="text-left p-3 rounded-lg border border-slate-200 hover:border-amber-300 hover:bg-amber-50/40 transition-colors group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-800 group-hover:text-amber-700">
                    FailCorp Demo (Step Failure &amp; Retry)
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-700 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  Triggers simulated task service outage. Demonstrates partial completion and isolated retry.
                </p>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !requestText.trim()}
              className="inline-flex items-center space-x-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Planning Workflow...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Dispatch Workflow</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
