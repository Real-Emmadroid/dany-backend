import React, { useState, useEffect } from 'react';
import { apiFetch, getAuthToken, setAuthToken } from './config.ts';
import { User, SystemStatus } from './types.ts';
import { LoginModal } from './components/LoginModal.tsx';
import { ConnectionHub } from './components/ConnectionHub.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { PosView } from './components/PosView.tsx';
import { ProductsView } from './components/ProductsView.tsx';
import { CategoriesView } from './components/CategoriesView.tsx';
import { SalesHistoryView } from './components/SalesHistoryView.tsx';
import { ReportsView } from './components/ReportsView.tsx';
import { StaffView } from './components/StaffView.tsx';
import { DatabaseIcon } from './components/Icons.tsx';

type Tab = 'dashboard' | 'pos' | 'products' | 'categories' | 'sales' | 'reports' | 'staff';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [productStatusFilter, setProductStatusFilter] = useState<'in_stock' | 'low_stock' | 'out_of_stock' | 'all'>('all');
  const [showConnectionHub, setShowConnectionHub] = useState(false);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);

  // Check current session
  const verifySession = async () => {
    const token = getAuthToken();
    if (!token) {
      setCurrentUser(null);
      setAuthChecking(false);
      return;
    }

    try {
      const user = await apiFetch<User>('/auth/me');
      setCurrentUser(user);
    } catch {
      setAuthToken(null);
      setCurrentUser(null);
    } finally {
      setAuthChecking(false);
    }
  };

  const checkSystemHealth = async () => {
    try {
      const status = await apiFetch<SystemStatus>('/system/status');
      setSystemStatus(status);
    } catch {
      setSystemStatus(null);
    }
  };

  useEffect(() => {
    verifySession();
    checkSystemHealth();
  }, []);

  const handleLogout = () => {
    setAuthToken(null);
    setCurrentUser(null);
  };

  const handleNavigateToProducts = (filter?: 'low_stock' | 'out_of_stock') => {
    if (filter) setProductStatusFilter(filter);
    else setProductStatusFilter('all');
    setActiveTab('products');
  };

  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100 text-stone-600 text-xs font-mono">
        Verifying secure session...
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-stone-100">
        <LoginModal
          onSuccess={(user) => {
            setCurrentUser(user);
            checkSystemHealth();
          }}
        />
      </div>
    );
  }

  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans text-stone-900">
      {/* Header bar */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo / System Title */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded bg-stone-900 text-white flex items-center justify-center font-bold text-sm tracking-tight font-mono">
                IS
              </div>
              <div>
                <span className="text-sm font-bold text-stone-900 tracking-tight">
                  Smart Inventory &amp; Stock Hub
                </span>
                <span className="hidden sm:inline-block ml-2 text-[10px] font-mono text-stone-500 uppercase tracking-widest bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200">
                  Node REST + Postgres
                </span>
              </div>
            </div>

            {/* Right Controls: Database status + Active user pill */}
            <div className="flex items-center space-x-3">
              {/* Connection Hub Trigger */}
              <button
                type="button"
                onClick={() => setShowConnectionHub(true)}
                className="flex items-center space-x-1.5 py-1 px-2.5 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded text-xs transition-colors cursor-pointer text-stone-700"
                title="Open API & Connection Hub"
              >
                <DatabaseIcon className="w-3.5 h-3.5 text-stone-600" />
                <span className="font-semibold hidden sm:inline">
                  {systemStatus?.database.provider === 'neon-postgres' ? 'Neon Postgres' : 'Connection Hub'}
                </span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    systemStatus?.database.provider === 'neon-postgres' ? 'bg-emerald-500' : 'bg-blue-500'
                  }`}
                />
              </button>

              {/* User Account Info */}
              <div className="flex items-center space-x-2 pl-2 border-l border-stone-200">
                <div className="text-right">
                  <div className="text-xs font-semibold text-stone-900 leading-tight">
                    {currentUser.name}
                  </div>
                  <span
                    className={`inline-block text-[10px] font-mono uppercase font-bold px-1.5 py-0.2 rounded ${
                      isAdmin ? 'bg-stone-900 text-white' : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {currentUser.role}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="py-1 px-2 text-xs font-semibold text-stone-500 hover:text-stone-900 border border-stone-200 rounded hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-stone-100 overflow-x-auto">
          <nav className="flex space-x-1 py-1.5 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              Overview &amp; Alerts
            </button>

            <button
              onClick={() => setActiveTab('pos')}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                activeTab === 'pos'
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              POS / Checkout
            </button>

            <button
              onClick={() => {
                setProductStatusFilter('all');
                setActiveTab('products');
              }}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                activeTab === 'products'
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              Products Catalog
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                activeTab === 'categories'
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              Categories
            </button>

            <button
              onClick={() => setActiveTab('sales')}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                activeTab === 'sales'
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              Sales History
            </button>

            {isAdmin && (
              <>
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                    activeTab === 'reports'
                      ? 'bg-stone-900 text-white'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  Valuation &amp; Reports
                </button>

                <button
                  onClick={() => setActiveTab('staff')}
                  className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                    activeTab === 'staff'
                      ? 'bg-stone-900 text-white'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  Staff Accounts
                </button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            onNavigateToProducts={handleNavigateToProducts}
            onNavigateToPos={() => setActiveTab('pos')}
          />
        )}

        {activeTab === 'pos' && <PosView />}

        {activeTab === 'products' && (
          <ProductsView
            currentUser={currentUser}
            initialStatusFilter={productStatusFilter}
          />
        )}

        {activeTab === 'categories' && <CategoriesView currentUser={currentUser} />}

        {activeTab === 'sales' && <SalesHistoryView />}

        {activeTab === 'reports' && isAdmin && <ReportsView />}

        {activeTab === 'staff' && isAdmin && <StaffView />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200 py-3 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Smart Inventory, Sales &amp; Stock Management System</span>
          <span className="font-mono text-[11px] text-stone-400">
            API Base: /api &bull; Atomic DB Transactions Active
          </span>
        </div>
      </footer>

      {/* Connection & Database Hub Modal */}
      <ConnectionHub
        isOpen={showConnectionHub}
        onClose={() => setShowConnectionHub(false)}
        onConnectionChange={() => checkSystemHealth()}
      />
    </div>
  );
}
