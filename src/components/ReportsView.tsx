import React, { useState, useEffect } from 'react';
import { apiFetch } from '../config.ts';
import { SalesReport, StockReport } from '../types.ts';

export const ReportsView: React.FC = () => {
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [stockReport, setStockReport] = useState<StockReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (from) params.append('from', from);
      if (to) params.append('to', to);

      const [salesData, stockData] = await Promise.all([
        apiFetch<SalesReport>(`/reports/sales?${params.toString()}`),
        apiFetch<StockReport>('/reports/stock'),
      ]);

      setSalesReport(salesData);
      setStockReport(stockData);
    } catch (err: any) {
      setError(err.message || 'Failed to load executive reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [from, to]);

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-stone-500">
        Calculating financial reports and stock valuations...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-900">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with date filters */}
      <div className="bg-white border border-stone-200 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-stone-900 tracking-tight">
              Executive Analytics & Valuation
            </h2>
            <p className="text-xs text-stone-500">
              Admin-level revenue analysis, product performance, and stock audits
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <div>
              <label className="block text-[10px] uppercase font-semibold text-stone-500 mb-0.5">
                From
              </label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="px-2 py-1 bg-stone-50 border border-stone-300 rounded text-stone-800"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-semibold text-stone-500 mb-0.5">
                To
              </label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="px-2 py-1 bg-stone-50 border border-stone-300 rounded text-stone-800"
              />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-stone-200 rounded-lg p-5">
          <div className="text-xs uppercase font-semibold text-stone-500">
            Total Revenue
          </div>
          <div className="text-2xl font-bold font-mono text-stone-900 mt-1">
            ${salesReport?.totalRevenue.toFixed(2) || '0.00'}
          </div>
          <div className="text-xs text-stone-500 mt-1">
            Across {salesReport?.totalTransactions || 0} completed orders
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-lg p-5">
          <div className="text-xs uppercase font-semibold text-stone-500">
            Total Inventory Valuation
          </div>
          <div className="text-2xl font-bold font-mono text-stone-900 mt-1">
            ${stockReport?.totalValuation.toFixed(2) || '0.00'}
          </div>
          <div className="text-xs text-stone-500 mt-1">
            Aggregate asset value at cost price
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-lg p-5">
          <div className="text-xs uppercase font-semibold text-stone-500">
            Attention Required
          </div>
          <div className="text-2xl font-bold font-mono text-amber-700 mt-1">
            {(stockReport?.lowStock.length || 0) + (stockReport?.outOfStock.length || 0)} items
          </div>
          <div className="text-xs text-stone-500 mt-1">
            {stockReport?.lowStock.length || 0} low stock, {stockReport?.outOfStock.length || 0} out of stock
          </div>
        </div>
      </div>

      {/* Best Sellers Table */}
      <div className="bg-white border border-stone-200 rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
            Top Performing Products (Best Sellers)
          </h3>
          <span className="text-xs text-stone-500 font-mono">Ranked by volume</span>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-stone-50/70 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-2.5 px-4">#</th>
              <th className="py-2.5 px-4">Product Name</th>
              <th className="py-2.5 px-4 text-right">Units Sold</th>
              <th className="py-2.5 px-4 text-right">Total Revenue Generated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {salesReport?.bestSellers.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-stone-400">
                  No sales recorded in the specified period.
                </td>
              </tr>
            ) : (
              salesReport?.bestSellers.map((item, idx) => (
                <tr key={item.productId} className="hover:bg-stone-50/50">
                  <td className="py-2.5 px-4 font-mono font-semibold text-stone-400">
                    {idx + 1}
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-stone-800">
                    {item.productName}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-semibold text-stone-900">
                    {item.unitsSold} units
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-700">
                    ${item.revenue.toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Stock Health Audits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Low Stock List */}
        <div className="bg-white border border-stone-200 rounded-lg p-5">
          <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-3">
            Low Stock Reorder List ({stockReport?.lowStock.length || 0})
          </h3>
          <div className="divide-y divide-stone-100 max-h-56 overflow-y-auto">
            {stockReport?.lowStock.length === 0 ? (
              <div className="py-4 text-center text-xs text-stone-400">No items below threshold</div>
            ) : (
              stockReport?.lowStock.map((it) => (
                <div key={it.id} className="py-2 flex items-center justify-between text-xs">
                  <span className="font-semibold text-stone-800">{it.name}</span>
                  <span className="font-mono text-amber-700 font-semibold">
                    {it.quantity} units (min {it.reorderThreshold})
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Out of Stock List */}
        <div className="bg-white border border-stone-200 rounded-lg p-5">
          <h3 className="text-xs font-bold text-rose-800 uppercase tracking-wider mb-3">
            Out of Stock Items ({stockReport?.outOfStock.length || 0})
          </h3>
          <div className="divide-y divide-stone-100 max-h-56 overflow-y-auto">
            {stockReport?.outOfStock.length === 0 ? (
              <div className="py-4 text-center text-xs text-stone-400">No out-of-stock items</div>
            ) : (
              stockReport?.outOfStock.map((it) => (
                <div key={it.id} className="py-2 flex items-center justify-between text-xs">
                  <span className="font-semibold text-stone-800">{it.name}</span>
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-mono text-[11px] font-semibold rounded">
                    0 in stock
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
