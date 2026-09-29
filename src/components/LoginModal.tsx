import React, { useState } from 'react';
import { apiFetch, setAuthToken } from '../config.ts';
import { User, AuthResponse } from '../types.ts';

interface LoginModalProps {
  onSuccess: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('Admin123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password }),
      });
      setAuthToken(res.token);
      onSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setCredentials = (role: 'admin' | 'staff') => {
    if (role === 'admin') {
      setEmail('admin@example.com');
      setPassword('Admin123!');
    } else {
      setEmail('staff@example.com');
      setPassword('Staff123!');
    }
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white border border-stone-200 rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 border-b border-stone-100">
          <div className="text-xs uppercase tracking-wider text-stone-500 font-semibold mb-1">
            Authentication
          </div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">
            Inventory & Sales System
          </h2>
          <p className="text-sm text-stone-500 mt-1">
            Sign in with your staff or administrator account to access the system.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-md">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-300 rounded-md focus:outline-none focus:border-stone-900 focus:bg-white transition-colors"
              placeholder="name@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-300 rounded-md focus:outline-none focus:border-stone-900 focus:bg-white transition-colors"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </div>

          <div className="pt-4 border-t border-stone-100">
            <div className="text-xs font-medium text-stone-500 mb-2">
              Quick Demo Fill:
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCredentials('admin')}
                className="py-1.5 px-3 text-xs font-medium bg-stone-100 hover:bg-stone-200 text-stone-800 rounded border border-stone-200 text-left transition-colors cursor-pointer"
              >
                <span className="block font-semibold">Admin Account</span>
                <span className="text-stone-500 font-mono text-[11px]">admin@example.com</span>
              </button>
              <button
                type="button"
                onClick={() => setCredentials('staff')}
                className="py-1.5 px-3 text-xs font-medium bg-stone-100 hover:bg-stone-200 text-stone-800 rounded border border-stone-200 text-left transition-colors cursor-pointer"
              >
                <span className="block font-semibold">Staff Account</span>
                <span className="text-stone-500 font-mono text-[11px]">staff@example.com</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
