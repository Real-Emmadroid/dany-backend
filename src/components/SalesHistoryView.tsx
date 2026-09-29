import React, { useState, useEffect } from 'react';
import { apiFetch } from '../config.ts';
import { SaleSummary, SaleDetail } from '../types.ts';
import { CloseIcon } from './Icons.tsx';

export const SalesHistoryView: React.FC = () => {
  const [sales, setSales] = useState<SaleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
  const [saleDetail, setSaleDetail] = useState<SaleDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadSales = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (from) params.append('from', from);
      if (to) params.append('to', to);

      const data = await apiFetch<SaleSummary[]>(`/sales?${params.toString()}`);
      setSales(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch sales history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, [from, to]);

  const handleOpenDetail = async (id: number) => {
    setSelectedSaleId(id);
    setDetailLoading(true);
    try {
      const data = await apiFetch<SaleDetail>(`/sales/${id}`);
      setSaleDetail(data);
    } catch (err: any) {
      alert(err.message || 'Failed to fetch sale details');
      setSelectedSaleId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedSaleId(null);
    setSaleDetail(null);
  };

  return (
    <div className="space-y-4">
      {/* Date Range Toolbar */}
      <div className="bg-white border border-stone-200 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-stone-900 tracking-tight">
              Sales History & Receipts
            </h2>
            <p className="text-xs text-stone-500">
              Audit recorded transactions and historical unit price snapshots
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <div>
              <label className="block text-[10px] uppercase font-semibold text-stone-500 mb-0.5">
                From Date
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
                To Date
              </label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="px-2 py-1 bg-stone-50 border border-stone-300 rounded text-stone-800"
              />
            </div>
            {(from || to) && (
              <button
                type="button"
                onClick={() => {
                  setFrom('');
                  setTo('');
                }}
                className="self-end pb-1 text-xs text-stone-500 hover:text-stone-800 underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-900 rounded-md">
          {error}
        </div>
      )}

      {/* Sales Table */}
      <div className="bg-white border border-stone-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 uppercase tracking-wider text-stone-500 font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-stone-400">
                    Loading sales records...
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-stone-400">
                    No sales recorded for this period.
                  </td>
                </tr>
              ) : (
                sales.map((s) => (
                  <tr key={s.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-stone-700">
                      #{s.id}
                    </td>
                    <td className="py-3 px-4 text-stone-600">
                      {new Date(s.createdAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 font-medium text-stone-800">
                      {s.staffName || 'System'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-stone-900">
                      ${s.total.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(s.id)}
                        className="py-1 px-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded font-semibold text-[11px] transition-colors cursor-pointer"
                      >
                        View Items
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sale Detail / Receipt Modal */}
      {selectedSaleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white border border-stone-200 rounded-lg shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
              <div>
                <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                  Sale Receipt #{selectedSaleId}
                </h3>
                {saleDetail && (
                  <p className="text-xs text-stone-500">
                    Staff: {saleDetail.staffName} &bull; {new Date(saleDetail.createdAt).toLocaleString()}
                  </p>
                )}
              </div>
              <button
                onClick={handleCloseDetail}
                className="p-1 text-stone-400 hover:text-stone-700 rounded cursor-pointer"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6">
              {detailLoading || !saleDetail ? (
                <div className="py-8 text-center text-xs text-stone-400">
                  Loading receipt items...
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="divide-y divide-stone-100 border border-stone-200 rounded-md overflow-hidden">
                    <div className="bg-stone-50 px-3 py-2 text-[11px] font-semibold text-stone-500 uppercase tracking-wider grid grid-cols-12">
                      <span className="col-span-6">Item</span>
                      <span className="col-span-2 text-right">Qty</span>
                      <span className="col-span-2 text-right">Price</span>
                      <span className="col-span-2 text-right">Subtotal</span>
                    </div>

                    {saleDetail.items.map((it, idx) => (
                      <div key={idx} className="px-3 py-2.5 text-xs grid grid-cols-12 items-center hover:bg-stone-50">
                        <span className="col-span-6 font-semibold text-stone-800 truncate">
                          {it.productName}
                        </span>
                        <span className="col-span-2 text-right font-mono text-stone-600">
                          {it.quantity}
                        </span>
                        <span className="col-span-2 text-right font-mono text-stone-600">
                          ${it.priceAtSale.toFixed(2)}
                        </span>
                        <span className="col-span-2 text-right font-mono font-semibold text-stone-900">
                          ${(it.priceAtSale * it.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex justify-between items-baseline text-sm font-bold text-stone-900">
                    <span>Receipt Grand Total:</span>
                    <span className="font-mono text-lg">${saleDetail.total.toFixed(2)}</span>
                  </div>

                  <div className="text-[11px] text-stone-400 bg-stone-50 p-2 rounded border border-stone-100">
                    Historical unit prices are snapshotted in <code className="font-mono text-stone-700">sale_items.price_at_sale</code> to guarantee revenue accuracy even if catalog prices change.
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-3 bg-stone-50 border-t border-stone-200 flex justify-end">
              <button
                onClick={handleCloseDetail}
                className="py-1.5 px-4 text-xs font-semibold bg-stone-900 text-white rounded hover:bg-stone-800 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
