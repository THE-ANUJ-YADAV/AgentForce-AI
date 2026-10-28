import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Server,
  Cpu,
  RotateCcw,
  Clock,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Loader2
} from 'lucide-react';

export default function Settings({ health = {}, onResetData }) {
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState(null);

  const handleConfirmReset = async () => {
    setError(null);
    setResetting(true);
    try {
      await onResetData();
      setResetSuccess(true);
      setConfirmOpen(false);
      setTimeout(() => setResetSuccess(false), 4000);
    } catch (err) {
      setError(err.message || 'Failed to reset state');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-lg font-bold text-slate-900">System Settings &amp; AI Configuration</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Backend server status, runtime environment, AI models, and demo memory state controls
        </p>
      </div>

      {resetSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Demo state reset successfully. Initial CRM contacts and tasks restored.</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* AI Engine Configuration */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">AI Intelligence Engine</h3>
            <p className="text-xs text-slate-500">Google Gemini API integration &amp; Fallback architecture</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Gemini API Configured
            </span>
            <div className="flex items-center space-x-2 pt-0.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  health.geminiConfigured ? 'bg-emerald-500' : 'bg-slate-400'
                }`}
              />
              <span className="font-bold text-slate-800 text-sm">
                {health.geminiConfigured ? 'Yes (Key Active)' : 'No (Deterministic Mode)'}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block pt-1">
              Keys are strictly guarded on the backend and never exposed to the browser.
            </span>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Active AI Mode
            </span>
            <div className="flex items-center space-x-2 pt-0.5">
              <span className="font-bold text-indigo-700 text-sm">
                {health.mode || 'Fallback'}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block pt-1">
              Model: <strong className="font-mono text-slate-600">{health.model || 'gemini-2.5-flash'}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Backend Server & Timezone */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Backend Server Runtime</h3>
            <p className="text-xs text-slate-500">Node.js Express REST API &amp; Calendar Timezone</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Server Status
            </span>
            <span className="font-bold text-emerald-700 text-sm block capitalize">
              {health.status || 'Active'}
            </span>
            <span className="text-[10px] text-slate-400 block">HTTP Port: 5000</span>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Business Calendar Timezone
            </span>
            <span className="font-bold text-slate-800 text-sm block">
              {health.timezone || 'Asia/Kolkata (IST)'}
            </span>
            <span className="text-[10px] text-slate-400 block">Strict deterministic date resolver</span>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Server Time
            </span>
            <span className="font-semibold text-slate-800 text-xs block">
              {health.time || 'N/A'}
            </span>
            <span className="text-[10px] font-mono text-slate-400 block truncate">
              {health.isoTime}
            </span>
          </div>
        </div>
      </div>

      {/* Admin Operations & Reset */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
            <RotateCcw className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Admin Operations &amp; State Reset</h3>
            <p className="text-xs text-slate-500">Restore factory demonstration data and wipe active logs</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-rose-50/50 border border-rose-200">
          <div>
            <div className="text-xs font-bold text-rose-950">Reset Demo Data</div>
            <p className="text-xs text-slate-600 mt-0.5">
              Clears all workflows, approvals, and dynamic activity logs, restoring the original seed contacts and tasks.
            </p>
          </div>

          <button
            onClick={() => setConfirmOpen(true)}
            disabled={resetting}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Confirm Demo Data Reset</h3>
                <p className="text-xs text-slate-500">This action will erase current workflows and reload seed records.</p>
              </div>
            </div>

            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
              Are you sure you want to proceed? All generated workflows, pending/resolved approvals, and execution logs will be cleared.
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={resetting}
                className="px-4 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReset}
                disabled={resetting}
                className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                {resetting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Reset</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
