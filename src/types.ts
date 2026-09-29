export type UserRole = 'admin' | 'staff';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  isActive?: boolean;
  createdAt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Category {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  categoryId: number;
  categoryName: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  reorderThreshold: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  updatedAt: string;
}

export interface SaleSummary {
  id: number;
  total: number;
  createdAt: string;
  staffName: string;
}

export interface SaleItemDetail {
  productId: number;
  productName: string;
  quantity: number;
  priceAtSale: number;
}

export interface SaleDetail extends SaleSummary {
  items: SaleItemDetail[];
}

export interface CreateSaleItemPayload {
  productId: number;
  quantity: number;
}

export interface CreateSaleResponse {
  sale: {
    id: number;
    staffId: number;
    total: number;
    createdAt: string;
  };
  items: Array<{
    id: number;
    saleId: number;
    productId: number;
    productName: string;
    quantity: number;
    priceAtSale: number;
  }>;
}

export interface DashboardReport {
  totalProducts: number;
  totalStockValue: number;
  todaysSales: number;
  lowStockCount: number;
  outOfStockCount: number;
  lowStockAlerts: Array<{
    id: number;
    name: string;
    quantity: number;
    reorderThreshold: number;
  }>;
  salesTrend: Array<{
    date: string;
    total: number;
  }>;
}

export interface BestSeller {
  productId: number;
  productName: string;
  unitsSold: number;
  revenue: number;
}

export interface SalesReport {
  totalRevenue: number;
  totalTransactions: number;
  bestSellers: BestSeller[];
}

export interface StockReport {
  totalValuation: number;
  lowStock: Array<{
    id: number;
    name: string;
    quantity: number;
    reorderThreshold: number;
  }>;
  outOfStock: Array<{
    id: number;
    name: string;
  }>;
}

export interface SystemStatus {
  status: string;
  timestamp: string;
  database: {
    connected: boolean;
    provider: 'neon-postgres' | 'in-memory-preview';
    message: string;
    databaseUrlSet: boolean;
  };
}
