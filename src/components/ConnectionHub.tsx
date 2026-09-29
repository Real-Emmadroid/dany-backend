import React, { useState, useEffect } from 'react';
import { getApiBaseUrl, setApiBaseUrl, apiFetch } from '../config.ts';
import { SystemStatus } from '../types.ts';
import { CloseIcon, DatabaseIcon, CheckIcon, AlertIcon } from './Icons.tsx';

interface ConnectionHubProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectionChange?: () => void;
}

export const ConnectionHub: React.FC<ConnectionHubProps> = ({ isOpen, onClose, onConnectionChange }) => {
  const [baseUrlInput, setBaseUrlInput] = useState(getApiBaseUrl());
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkConnection = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<SystemStatus>('/system/status');
      setSystemStatus(res);
    } catch (err: any) {
      setError(err.message || 'Failed to ping backend system');
      setSystemStatus(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setBaseUrlInput(getApiBaseUrl());
      checkConnection();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setApiBaseUrl(baseUrlInput.trim() || '/api');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
    checkConnection();
    if (onConnectionChange) onConnectionChange();
  };

  const handleReset = () => {
    setBaseUrlInput('/api');
    setApiBaseUrl('/api');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
    checkConnection();
    if (onConnectionChange) onConnectionChange();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-xl bg-white border border-stone-200 rounded-lg shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
          <div className="flex items-center space-x-2.5">
            <DatabaseIcon className="w-5 h-5 text-stone-700" />
            <div>
              <h3 className="text-base font-bold text-stone-900 leading-tight">
                API & Connection Hub
              </h3>
              <p className="text-xs text-stone-500">
                Backend REST service & PostgreSQL database connection config
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Active Status Banner */}
          <div className="border border-stone-200 rounded-md p-4 bg-stone-50">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs uppercase font-semibold text-stone-500 mb-1">
                  Database & Engine Status
                </div>
                {systemStatus ? (
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-block w-2.5 h-2.5 rounded-full ${systemStatus.database.provider === 'neon-postgres' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                      <span className="text-sm font-semibold text-stone-900">
                        {systemStatus.database.provider === 'neon-postgres' ? 'Neon PostgreSQL (Connected)' : 'Relational Preview Engine'}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600">
                      {systemStatus.database.message}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-stone-500 text-xs">
                    {loading ? 'Checking server health...' : error ? error : 'Offline or disconnected'}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={checkConnection}
                disabled={loading}
                className="py-1 px-2.5 text-xs font-medium border border-stone-300 rounded bg-white hover:bg-stone-100 text-stone-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Testing...' : 'Test Connection'}
              </button>
            </div>
          </div>

          {/* API Base URL Configuration Form */}
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                API Base URL
              </label>
              <div className="text-xs text-stone-500 mb-2">
                This applet is wired to the internal Express backend at <code className="font-mono bg-stone-100 px-1 py-0.5 rounded text-stone-800">/api</code>.
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={baseUrlInput}
                  onChange={(e) => setBaseUrlInput(e.target.value)}
                  placeholder="/api"
                  className="flex-1 px-3 py-2 text-sm font-mono bg-stone-50 border border-stone-300 rounded-md focus:outline-none focus:border-stone-900 focus:bg-white"
                />
                <button
                  type="submit"
                  className="py-2 px-4 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-md transition-colors cursor-pointer"
                >
                  Save URL
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="py-2 px-3 border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-semibold rounded-md transition-colors cursor-pointer"
                >
                  Reset Default
                </button>
              </div>
            </div>

            {saveSuccess && (
              <div className="text-xs text-emerald-700 flex items-center space-x-1 font-medium">
                <CheckIcon className="w-3.5 h-3.5" />
                <span>Base URL saved successfully</span>
              </div>
            )}
          </form>

          {/* Setup Guide for Neon Database Secret */}
          <div className="border-t border-stone-200 pt-4">
            <h4 className="text-xs font-semibold text-stone-800 uppercase tracking-wider mb-2">
              Neon PostgreSQL Secret Instructions
            </h4>
            <div className="text-xs text-stone-600 space-y-1.5 leading-relaxed bg-stone-50 p-3 rounded border border-stone-200">
              <p>
                To connect your live Neon database, configure the secret in your environment or AI Studio Secrets panel:
              </p>
              <div className="font-mono text-[11px] bg-stone-100 text-stone-900 p-2 rounded border border-stone-200 select-all overflow-x-auto">
                DATABASE_URL=&quot;postgresql://user:pass@ep-cool-sample.us-east-2.aws.neon.tech/neondb?sslmode=require&quot;
              </div>
              <p className="text-stone-500">
                The Express backend uses the <code className="font-mono text-stone-700">pg</code> driver with safe SSL verification, runs migrations automatically, and initializes transaction locks (<code className="font-mono text-stone-700">SELECT ... FOR UPDATE</code>) on checkout.
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 bg-stone-50 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="py-1.5 px-4 text-xs font-semibold bg-stone-900 text-white rounded hover:bg-stone-800 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
