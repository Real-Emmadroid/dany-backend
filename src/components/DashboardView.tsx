import React, { useEffect, useState } from 'react';
import { apiFetch } from '../config.ts';
import { DashboardReport } from '../types.ts';
import { AlertIcon } from './Icons.tsx';

interface DashboardViewProps {
  onNavigateToProducts: (filterStatus?: 'low_stock' | 'out_of_stock') => void;
  onNavigateToPos: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateToProducts, onNavigateToPos }) => {
  const [report, setReport] = useState<DashboardReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch<DashboardReport>('/reports/dashboard');
      setReport(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-stone-500">
        Loading inventory overview & real-time analytics...
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-900 flex items-center justify-between">
        <div>{error || 'Unable to load dashboard data'}</div>
        <button
          onClick={fetchDashboard}
          className="px-3 py-1 bg-amber-900 text-white rounded text-xs font-medium cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  const maxTrend = Math.max(...report.salesTrend.map(t => t.total), 10);

  return (
    <div className="space-y-6">
      {/* Top summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-4 bg-white border border-stone-200 rounded-lg">
          <div className="text-xs uppercase tracking-wider font-semibold text-stone-500">
            Total Products
          </div>
          <div className="text-2xl font-bold font-mono text-stone-900 mt-1">
            {report.totalProducts}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            Active in catalog
          </div>
        </div>

        <div className="p-4 bg-white border border-stone-200 rounded-lg">
          <div className="text-xs uppercase tracking-wider font-semibold text-stone-500">
            Stock Valuation
          </div>
          <div className="text-2xl font-bold font-mono text-stone-900 mt-1">
            ${report.totalStockValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            At inventory cost
          </div>
        </div>

        <div className="p-4 bg-white border border-stone-200 rounded-lg">
          <div className="text-xs uppercase tracking-wider font-semibold text-stone-500">
            Today&apos;s Revenue
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
            ${report.todaysSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            Recorded today
          </div>
        </div>

        <div
          onClick={() => onNavigateToProducts('low_stock')}
          className="p-4 bg-white border border-amber-200 rounded-lg cursor-pointer hover:bg-amber-50/50 transition-colors"
        >
          <div className="text-xs uppercase tracking-wider font-semibold text-amber-800">
            Low Stock
          </div>
          <div className="text-2xl font-bold font-mono text-amber-700 mt-1">
            {report.lowStockCount}
          </div>
          <div className="text-[11px] text-amber-800/80 mt-1">
            At or below reorder
          </div>
        </div>

        <div
          onClick={() => onNavigateToProducts('out_of_stock')}
          className="p-4 bg-white border border-rose-200 rounded-lg cursor-pointer hover:bg-rose-50/50 transition-colors"
        >
          <div className="text-xs uppercase tracking-wider font-semibold text-rose-800">
            Out of Stock
          </div>
          <div className="text-2xl font-bold font-mono text-rose-700 mt-1">
            {report.outOfStockCount}
          </div>
          <div className="text-[11px] text-rose-800/80 mt-1">
            Zero inventory left
          </div>
        </div>
      </div>

      {/* Main Grid: 7-Day Trend + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Sales Trend Bar Graph */}
        <div className="lg:col-span-2 bg-white border border-stone-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                7-Day Sales Velocity
              </h3>
              <p className="text-xs text-stone-500">
                Daily transaction totals snapshot
              </p>
            </div>
            <button
              onClick={onNavigateToPos}
              className="py-1 px-3 bg-stone-900 hover:bg-stone-800 text-white rounded text-xs font-semibold transition-colors cursor-pointer"
            >
              Open Register (POS)
            </button>
          </div>

          <div className="h-48 flex items-end justify-between gap-3 pt-6 pb-2 border-b border-stone-100">
            {report.salesTrend.map((t) => {
              const heightPercent = Math.max(Math.round((t.total / maxTrend) * 100), 4);
              const dayName = new Date(t.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
              return (
                <div key={t.date} className="flex-1 flex flex-col items-center h-full justify-end group">
                  <div className="text-[10px] font-mono text-stone-500 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    ${t.total.toFixed(0)}
                  </div>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full max-w-[40px] bg-stone-800 rounded-t-sm group-hover:bg-stone-600 transition-colors"
                  />
                  <div className="text-[10px] text-stone-500 font-medium mt-2 whitespace-nowrap">
                    {dayName}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-stone-500 pt-3">
            <span>Past 7 days performance</span>
            <span className="font-mono font-medium text-stone-800">
              Total: ${report.salesTrend.reduce((sum, d) => sum + d.total, 0).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Low Stock Alerts Box */}
        <div className="bg-white border border-stone-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-1.5">
              <AlertIcon className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                Restock Watchlist
              </h3>
            </div>
            <span className="text-xs font-mono text-stone-500">
              {report.lowStockAlerts.length} items
            </span>
          </div>

          <div className="divide-y divide-stone-100 max-h-56 overflow-y-auto">
            {report.lowStockAlerts.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-400">
                All inventory quantities are above reorder thresholds.
              </div>
            ) : (
              report.lowStockAlerts.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between">
                  <div className="pr-2 truncate">
                    <div className="text-xs font-semibold text-stone-800 truncate">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-stone-500">
                      Threshold: <span className="font-mono">{item.reorderThreshold}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-2 py-0.5 text-xs font-mono font-semibold rounded ${
                        item.quantity === 0
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.quantity} in stock
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-3 border-t border-stone-100 text-right">
            <button
              onClick={() => onNavigateToProducts('low_stock')}
              className="text-xs font-semibold text-stone-700 hover:text-stone-900 cursor-pointer"
            >
              View Filtered Products &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
