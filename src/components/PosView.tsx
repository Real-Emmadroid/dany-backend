import React, { useState, useEffect } from 'react';
import { apiFetch } from '../config.ts';
import { Product, CreateSaleResponse } from '../types.ts';
import { SearchIcon, TrashIcon, CheckIcon } from './Icons.tsx';

interface CartItem {
  product: Product;
  quantity: number;
}

export const PosView: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastReceipt, setLastReceipt] = useState<CreateSaleResponse | null>(null);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<Product[]>('/products');
      setProducts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load products for checkout');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const addToCart = (product: Product) => {
    if (product.quantity <= 0) return;

    setError(null);
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) {
          setError(`Cannot add more than ${product.quantity} available units of "${product.name}".`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, newQty: number) => {
    setError(null);
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          if (newQty > item.product.quantity) {
            setError(`Only ${item.product.quantity} units in stock for "${item.product.name}".`);
            return { ...item, quantity: item.product.quantity };
          }
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setError(null);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      };

      const res = await apiFetch<CreateSaleResponse>('/sales', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setLastReceipt(res);
      setCart([]);
      // Reload products to reflect updated inventory after transaction
      loadProducts();
    } catch (err: any) {
      setError(err.message || 'Transaction failed. Stock may have changed.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.categoryName.toLowerCase().includes(q);
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Product Catalog Picker (Left 2 cols) */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white border border-stone-200 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-stone-900 tracking-tight">
                Point of Sale / Quick Register
              </h2>
              <p className="text-xs text-stone-500">
                Select products to assemble customer order and complete transactional checkout
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-stone-400">
                <SearchIcon className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                placeholder="Search name, SKU, category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-md focus:outline-none focus:border-stone-900 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-stone-500 bg-white border border-stone-200 rounded-lg">
            Loading products for checkout...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredProducts.map((p) => {
              const isOutOfStock = p.quantity <= 0;
              const inCart = cart.find((c) => c.product.id === p.id);

              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={isOutOfStock}
                  onClick={() => addToCart(p)}
                  className={`p-3.5 text-left bg-white border rounded-lg transition-all flex flex-col justify-between ${
                    isOutOfStock
                      ? 'opacity-50 border-stone-200 bg-stone-50 cursor-not-allowed'
                      : inCart
                      ? 'border-stone-900 ring-1 ring-stone-900 hover:bg-stone-50 cursor-pointer'
                      : 'border-stone-200 hover:border-stone-400 cursor-pointer'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-mono text-stone-500">{p.sku}</span>
                      <span className="text-stone-500">{p.categoryName}</span>
                    </div>
                    <div className="text-sm font-semibold text-stone-900 line-clamp-1">
                      {p.name}
                    </div>
                  </div>

                  <div className="mt-3 flex items-baseline justify-between pt-2 border-t border-stone-100">
                    <span className="text-base font-bold font-mono text-stone-900">
                      ${p.sellingPrice.toFixed(2)}
                    </span>
                    <span
                      className={`text-[11px] font-mono font-medium ${
                        isOutOfStock
                          ? 'text-rose-600'
                          : p.quantity <= p.reorderThreshold
                          ? 'text-amber-700'
                          : 'text-stone-600'
                      }`}
                    >
                      {isOutOfStock ? 'Sold Out' : `${p.quantity} in stock`}
                    </span>
                  </div>

                  {inCart && (
                    <div className="mt-2 text-center py-1 bg-stone-100 text-stone-800 text-[11px] font-semibold rounded font-mono">
                      In cart: {inCart.quantity}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Cart & Checkout Panel (Right col) */}
      <div className="space-y-4">
        <div className="bg-white border border-stone-200 rounded-lg p-5 flex flex-col h-full">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                Current Order
              </h3>
              <div className="text-xs text-stone-500 font-mono">
                {cart.reduce((s, i) => s + i.quantity, 0)} items selected
              </div>
            </div>

            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-xs text-stone-500 hover:text-stone-800 cursor-pointer"
              >
                Clear Cart
              </button>
            )}
          </div>

          {error && (
            <div className="mt-3 p-3 text-xs text-rose-900 bg-rose-50 border border-rose-200 rounded-md">
              <span className="font-semibold block mb-0.5">Checkout Notice:</span>
              {error}
            </div>
          )}

          {/* Cart items list */}
          <div className="divide-y divide-stone-100 my-3 flex-1 max-h-96 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="py-12 text-center text-xs text-stone-400">
                Cart is currently empty.
                <br />
                Click products to add them to this sale.
              </div>
            ) : (
              cart.map(({ product, quantity }) => (
                <div key={product.id} className="py-3 flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-stone-900 truncate">
                      {product.name}
                    </div>
                    <div className="text-[11px] font-mono text-stone-500">
                      ${product.sellingPrice.toFixed(2)} each
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="flex items-center border border-stone-300 rounded overflow-hidden">
                      <button
                        type="button"
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                        className="px-2 py-0.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-mono text-xs cursor-pointer"
                      >
                        -
                      </button>
                      <span className="px-2.5 py-0.5 text-xs font-mono font-semibold text-stone-900">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                        className="px-2 py-0.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-mono text-xs cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    <div className="w-16 text-right font-mono font-semibold text-xs text-stone-900">
                      ${(product.sellingPrice * quantity).toFixed(2)}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(product.id)}
                      className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer"
                      aria-label="Remove item"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Subtotal & Checkout button */}
          <div className="pt-3 border-t border-stone-200 space-y-3">
            <div className="flex items-baseline justify-between text-base font-bold text-stone-900">
              <span>Grand Total</span>
              <span className="font-mono text-xl">${cartTotal.toFixed(2)}</span>
            </div>

            <div className="text-[11px] text-stone-500">
              * Atomic transaction with row locking (<code className="font-mono text-stone-700">SELECT ... FOR UPDATE</code>) ensures no overselling occurs.
            </div>

            <button
              type="button"
              disabled={cart.length === 0 || submitting}
              onClick={handleCheckout}
              className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white text-sm font-semibold rounded-md transition-colors cursor-pointer"
            >
              {submitting ? 'Executing Transaction...' : `Complete Sale ($${cartTotal.toFixed(2)})`}
            </button>
          </div>
        </div>
      </div>

      {/* Sale Receipt Confirmation Modal */}
      {lastReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white border border-stone-200 rounded-lg shadow-xl p-6">
            <div className="text-center pb-4 border-b border-stone-100">
              <div className="w-10 h-10 mx-auto mb-2 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center">
                <CheckIcon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-stone-900">
                Transaction Completed
              </h3>
              <p className="text-xs text-stone-500 font-mono mt-0.5">
                Receipt #{lastReceipt.sale.id} &bull; {new Date(lastReceipt.sale.createdAt).toLocaleTimeString()}
              </p>
            </div>

            <div className="py-4 divide-y divide-stone-100 max-h-56 overflow-y-auto">
              {lastReceipt.items.map((it) => (
                <div key={it.id} className="py-2 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-stone-800">{it.productName}</span>
                    <span className="text-stone-500 font-mono ml-2">x{it.quantity}</span>
                  </div>
                  <div className="font-mono text-stone-900">
                    ${(it.priceAtSale * it.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-stone-200 flex justify-between items-baseline mb-5">
              <span className="text-sm font-bold text-stone-900">Total Charged</span>
              <span className="text-xl font-bold font-mono text-stone-900">
                ${lastReceipt.sale.total.toFixed(2)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setLastReceipt(null)}
              className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-white rounded text-xs font-semibold cursor-pointer"
            >
              Start Next Sale
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
