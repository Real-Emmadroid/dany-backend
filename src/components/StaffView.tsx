import React, { useState, useEffect } from 'react';
import { apiFetch } from '../config.ts';
import { User } from '../types.ts';
import { PlusIcon, CloseIcon } from './Icons.tsx';

export const StaffView: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff' as 'admin' | 'staff',
  });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch<User[]>('/users');
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch team members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError(null);

    try {
      await apiFetch<User>('/users', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setShowAddModal(false);
      setFormData({ name: '', email: '', password: '', role: 'staff' });
      loadUsers();
    } catch (err: any) {
      setModalError(err.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      const updated = await apiFetch<User>(`/users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
    } catch (err: any) {
      alert(err.message || 'Failed to update user status');
    }
  };

  const handleChangeRole = async (user: User, newRole: 'admin' | 'staff') => {
    try {
      const updated = await apiFetch<User>(`/users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
    } catch (err: any) {
      alert(err.message || 'Failed to update user role');
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-stone-200 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-stone-900 tracking-tight">
              User & Staff Management
            </h2>
            <p className="text-xs text-stone-500">
              Admin & staff access control, role authorization, and account statuses
            </p>
          </div>

          <button
            onClick={() => {
              setModalError(null);
              setShowAddModal(true);
            }}
            className="flex items-center space-x-1.5 py-1.5 px-3 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-md transition-colors cursor-pointer"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            <span>Create Account</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-900 rounded-md">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white border border-stone-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 uppercase tracking-wider text-stone-500 font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-400">
                    Loading accounts...
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-stone-50/50">
                    <td className="py-3 px-4 font-semibold text-stone-900">
                      {u.name}
                    </td>
                    <td className="py-3 px-4 font-mono text-stone-600">
                      {u.email}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleChangeRole(u, e.target.value as 'admin' | 'staff')}
                        className="py-1 px-2 border border-stone-300 rounded bg-white text-xs text-stone-800 cursor-pointer"
                      >
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                          u.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-stone-200 text-stone-600'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-stone-500">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(u)}
                        className={`py-1 px-2.5 rounded text-[11px] font-semibold cursor-pointer border ${
                          u.isActive
                            ? 'border-stone-300 hover:bg-stone-100 text-stone-700'
                            : 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        }`}
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white border border-stone-200 rounded-lg shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                Create New User Account
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded cursor-pointer"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4 text-xs">
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-md">
                  {modalError}
                </div>
              )}

              <div>
                <label className="block font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-md focus:outline-none focus:border-stone-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-md focus:outline-none focus:border-stone-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Initial Password * (min 6 chars)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-md focus:outline-none focus:border-stone-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  System Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'staff' })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-md focus:outline-none focus:border-stone-900 focus:bg-white"
                >
                  <option value="staff">Staff (Standard POS & Catalog access)</option>
                  <option value="admin">Administrator (Full CRUD, Reports, Users)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-stone-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="py-1.5 px-3 border border-stone-300 rounded text-stone-700 hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="py-1.5 px-4 bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Creating...' : 'Save Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
