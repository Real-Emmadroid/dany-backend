import React, { useState, useEffect } from 'react';
import { apiFetch } from '../config.ts';
import { Product, Category, User } from '../types.ts';
import { SearchIcon, PlusIcon, EditIcon, TrashIcon, CloseIcon } from './Icons.tsx';

interface ProductsViewProps {
  currentUser: User;
  initialStatusFilter?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'all';
}

export const ProductsView: React.FC<ProductsViewProps> = ({ currentUser, initialStatusFilter = 'all' }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>(initialStatusFilter);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    categoryId: '',
    costPrice: '',
    sellingPrice: '',
    quantity: '0',
    reorderThreshold: '5',
  });
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const isAdmin = currentUser.role === 'admin';

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (selectedCategory) params.append('categoryId', selectedCategory);
      if (selectedStatus && selectedStatus !== 'all') params.append('status', selectedStatus);

      const [prodsData, catsData] = await Promise.all([
        apiFetch<Product[]>(`/products?${params.toString()}`),
        apiFetch<Category[]>('/categories'),
      ]);

      setProducts(prodsData);
      setCategories(catsData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch inventory products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, selectedCategory, selectedStatus]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: `PROD-${Math.floor(100 + Math.random() * 900)}`,
      categoryId: categories.length > 0 ? String(categories[0].id) : '1',
      costPrice: '',
      sellingPrice: '',
      quantity: '10',
      reorderThreshold: '5',
    });
    setModalError(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      sku: p.sku,
      categoryId: String(p.categoryId),
      costPrice: String(p.costPrice),
      sellingPrice: String(p.sellingPrice),
      quantity: String(p.quantity),
      reorderThreshold: String(p.reorderThreshold),
    });
    setModalError(null);
    setShowAddModal(true);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete product "${name}"?`)) {
      return;
    }

    try {
      await apiFetch(`/products/${id}`, { method: 'DELETE' });
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalSubmitting(true);
    setModalError(null);

    try {
      const payload = {
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        categoryId: parseInt(formData.categoryId, 10),
        costPrice: parseFloat(formData.costPrice),
        sellingPrice: parseFloat(formData.sellingPrice),
        quantity: parseInt(formData.quantity, 10),
        reorderThreshold: parseInt(formData.reorderThreshold, 10),
      };

      if (editingProduct) {
        await apiFetch(`/products/${editingProduct.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch('/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      setShowAddModal(false);
      loadData();
    } catch (err: any) {
      setModalError(err.message || 'Submission failed');
    } finally {
      setModalSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top filter toolbar */}
      <div className="bg-white border border-stone-200 rounded-lg p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex-1 flex flex-col sm:flex-row gap-2">
            {/* Search */}
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-stone-400">
                <SearchIcon className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                placeholder="Search products by SKU or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-md focus:outline-none focus:border-stone-900 focus:bg-white"
              />
            </div>

            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="py-1.5 px-3 text-xs bg-stone-50 border border-stone-300 rounded-md focus:outline-none focus:border-stone-900 focus:bg-white text-stone-700"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Status Tabs */}
            <div className="flex rounded-md border border-stone-300 bg-stone-100 p-0.5 text-xs">
              {(['all', 'in_stock', 'low_stock', 'out_of_stock'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSelectedStatus(st)}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    selectedStatus === st
                      ? 'bg-white font-semibold text-stone-900 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {st === 'all'
                    ? 'All'
                    : st === 'in_stock'
                    ? 'In Stock'
                    : st === 'low_stock'
                    ? 'Low'
                    : 'Out'}
                </button>
              ))}
            </div>
          </div>

          {isAdmin && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center space-x-1.5 py-1.5 px-3 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-md transition-colors cursor-pointer"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              <span>Add Product</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-900 rounded-md">
          {error}
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white border border-stone-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 uppercase tracking-wider text-stone-500 font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Cost</th>
                <th className="py-3 px-4 text-right">Selling Price</th>
                <th className="py-3 px-4 text-right">Margin</th>
                <th className="py-3 px-4 text-right">Stock</th>
                <th className="py-3 px-4 text-center">Status</th>
                {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 9 : 8} className="py-8 text-center text-stone-400">
                    Loading inventory catalog...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 9 : 8} className="py-8 text-center text-stone-400">
                    No products found matching active filters.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const margin = p.sellingPrice > 0 ? (((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100).toFixed(0) : '0';
                  return (
                    <tr key={p.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-stone-600">
                        {p.sku}
                      </td>
                      <td className="py-3 px-4 font-semibold text-stone-900">
                        {p.name}
                      </td>
                      <td className="py-3 px-4 text-stone-600">
                        {p.categoryName}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-stone-600">
                        ${p.costPrice.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-stone-900">
                        ${p.sellingPrice.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-stone-500 text-[11px]">
                        {margin}%
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-stone-900">
                        {p.quantity}
                        <span className="text-[10px] text-stone-400 font-normal ml-1">
                          (min {p.reorderThreshold})
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                            p.status === 'out_of_stock'
                              ? 'bg-rose-100 text-rose-800'
                              : p.status === 'low_stock'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {p.status === 'out_of_stock'
                            ? 'Out of Stock'
                            : p.status === 'low_stock'
                            ? 'Low Stock'
                            : 'In Stock'}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            className="p-1 text-stone-500 hover:text-stone-900 rounded cursor-pointer"
                            aria-label={`Edit ${p.name}`}
                          >
                            <EditIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(p.id, p.name)}
                            className="p-1 text-stone-400 hover:text-rose-600 rounded cursor-pointer"
                            aria-label={`Delete ${p.name}`}
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white border border-stone-200 rounded-lg shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                {editingProduct ? 'Edit Product Details' : 'Add New Inventory Item'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded cursor-pointer"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 text-xs">
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-md">
                  {modalError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Product Title *
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
                    SKU Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 font-mono bg-stone-50 border border-stone-300 rounded-md focus:outline-none focus:border-stone-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-md focus:outline-none focus:border-stone-900 focus:bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Cost Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    className="w-full px-3 py-2 font-mono bg-stone-50 border border-stone-300 rounded-md focus:outline-none focus:border-stone-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Selling Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                    className="w-full px-3 py-2 font-mono bg-stone-50 border border-stone-300 rounded-md focus:outline-none focus:border-stone-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Quantity In Stock *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-3 py-2 font-mono bg-stone-50 border border-stone-300 rounded-md focus:outline-none focus:border-stone-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Reorder Threshold *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.reorderThreshold}
                    onChange={(e) => setFormData({ ...formData, reorderThreshold: e.target.value })}
                    className="w-full px-3 py-2 font-mono bg-stone-50 border border-stone-300 rounded-md focus:outline-none focus:border-stone-900 focus:bg-white"
                  />
                </div>
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
                  disabled={modalSubmitting}
                  className="py-1.5 px-4 bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {modalSubmitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
