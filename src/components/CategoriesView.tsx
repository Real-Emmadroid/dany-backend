import React, { useState, useEffect } from 'react';
import { apiFetch } from '../config.ts';
import { Category, User } from '../types.ts';
import { PlusIcon } from './Icons.tsx';

interface CategoriesViewProps {
  currentUser: User;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({ currentUser }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCatName, setNewCatName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = currentUser.role === 'admin';

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch<Category[]>('/categories');
      setCategories(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      await apiFetch<Category>('/categories', {
        method: 'POST',
        body: JSON.stringify({ name: newCatName.trim() }),
      });
      setNewCatName('');
      loadCategories();
    } catch (err: any) {
      setError(err.message || 'Failed to create category');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white border border-stone-200 rounded-lg p-5">
        <h2 className="text-base font-bold text-stone-900 tracking-tight">
          Product Categories
        </h2>
        <p className="text-xs text-stone-500 mt-0.5">
          Organize inventory lines and classification structures
        </p>

        {isAdmin && (
          <form onSubmit={handleAddCategory} className="mt-4 pt-4 border-t border-stone-100 flex gap-2">
            <input
              type="text"
              placeholder="New category name (e.g. Hardware)..."
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="flex-1 px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-md focus:outline-none focus:border-stone-900 focus:bg-white"
            />
            <button
              type="submit"
              disabled={submitting || !newCatName.trim()}
              className="flex items-center space-x-1.5 py-2 px-4 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white text-xs font-semibold rounded-md transition-colors cursor-pointer"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              <span>Add Category</span>
            </button>
          </form>
        )}

        {error && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-xs text-rose-900 rounded-md">
            {error}
          </div>
        )}
      </div>

      <div className="bg-white border border-stone-200 rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-stone-200 bg-stone-50 text-xs font-semibold uppercase tracking-wider text-stone-500">
          All Categories ({categories.length})
        </div>

        <div className="divide-y divide-stone-100">
          {loading ? (
            <div className="py-8 text-center text-xs text-stone-400">
              Loading categories...
            </div>
          ) : categories.length === 0 ? (
            <div className="py-8 text-center text-xs text-stone-400">
              No categories configured yet.
            </div>
          ) : (
            categories.map((c) => (
              <div key={c.id} className="py-3 px-5 flex items-center justify-between text-xs hover:bg-stone-50/50">
                <span className="font-semibold text-stone-800">{c.name}</span>
                <span className="font-mono text-[11px] text-stone-400">ID #{c.id}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
