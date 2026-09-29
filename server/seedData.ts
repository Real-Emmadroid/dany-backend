export interface SeedCategory {
  id?: number;
  name: string;
}

export interface SeedProduct {
  name: string;
  sku: string;
  categoryName: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  reorderThreshold: number;
}

export const initialCategories: SeedCategory[] = [
  { name: 'Electronics' },
  { name: 'Groceries' },
  { name: 'Stationery' },
  { name: 'Household' },
];

export const initialProducts: SeedProduct[] = [
  // Electronics
  {
    name: 'Wireless Bluetooth Headphones',
    sku: 'ELEC-WIR-001',
    categoryName: 'Electronics',
    costPrice: 24.50,
    sellingPrice: 59.99,
    quantity: 18,
    reorderThreshold: 5,
  },
  {
    name: 'USB-C Fast Charging Cable (2m)',
    sku: 'ELEC-CAB-002',
    categoryName: 'Electronics',
    costPrice: 3.20,
    sellingPrice: 12.99,
    quantity: 4, // Below reorder threshold (low stock)
    reorderThreshold: 10,
  },
  {
    name: 'Mechanical Gaming Keyboard',
    sku: 'ELEC-KEY-003',
    categoryName: 'Electronics',
    costPrice: 42.00,
    sellingPrice: 89.99,
    quantity: 12,
    reorderThreshold: 4,
  },
  {
    name: 'Compact Power Bank 10000mAh',
    sku: 'ELEC-PWR-004',
    categoryName: 'Electronics',
    costPrice: 11.50,
    sellingPrice: 27.50,
    quantity: 0, // Out of stock
    reorderThreshold: 6,
  },

  // Groceries
  {
    name: 'Organic Whole Bean Coffee (500g)',
    sku: 'GROC-COF-001',
    categoryName: 'Groceries',
    costPrice: 7.20,
    sellingPrice: 15.49,
    quantity: 26,
    reorderThreshold: 8,
  },
  {
    name: 'Pure Extra Virgin Olive Oil (750ml)',
    sku: 'GROC-OIL-002',
    categoryName: 'Groceries',
    costPrice: 8.50,
    sellingPrice: 16.99,
    quantity: 3, // Below reorder threshold (low stock)
    reorderThreshold: 5,
  },
  {
    name: 'Artisan Sourdough Loaf',
    sku: 'GROC-BRD-003',
    categoryName: 'Groceries',
    costPrice: 1.80,
    sellingPrice: 4.50,
    quantity: 15,
    reorderThreshold: 5,
  },
  {
    name: 'Raw Wildflower Honey (350g)',
    sku: 'GROC-HNY-004',
    categoryName: 'Groceries',
    costPrice: 4.00,
    sellingPrice: 9.25,
    quantity: 11,
    reorderThreshold: 4,
  },

  // Stationery
  {
    name: 'A5 Hardcover Dot-Grid Notebook',
    sku: 'STAT-NTB-001',
    categoryName: 'Stationery',
    costPrice: 3.50,
    sellingPrice: 11.95,
    quantity: 22,
    reorderThreshold: 6,
  },
  {
    name: 'Fine Gel Pen Set (Pack of 8)',
    sku: 'STAT-PEN-002',
    categoryName: 'Stationery',
    costPrice: 2.10,
    sellingPrice: 7.99,
    quantity: 2, // Low stock
    reorderThreshold: 5,
  },
  {
    name: 'Self-Adhesive Sticky Notes (3x3)',
    sku: 'STAT-STK-003',
    categoryName: 'Stationery',
    costPrice: 0.90,
    sellingPrice: 3.20,
    quantity: 45,
    reorderThreshold: 10,
  },
  {
    name: 'Heavy Duty Metal Desktop Stapler',
    sku: 'STAT-STP-004',
    categoryName: 'Stationery',
    costPrice: 5.60,
    sellingPrice: 14.50,
    quantity: 7,
    reorderThreshold: 3,
  },

  // Household
  {
    name: 'Stainless Steel Insulated Tumbler',
    sku: 'HOUS-TUM-001',
    categoryName: 'Household',
    costPrice: 8.00,
    sellingPrice: 22.00,
    quantity: 14,
    reorderThreshold: 5,
  },
  {
    name: 'Natural Soy Wax Scented Candle',
    sku: 'HOUS-CND-002',
    categoryName: 'Household',
    costPrice: 6.20,
    sellingPrice: 18.50,
    quantity: 9,
    reorderThreshold: 4,
  },
  {
    name: 'Microfiber Cleaning Cloths (10-pack)',
    sku: 'HOUS-CLO-003',
    categoryName: 'Household',
    costPrice: 3.00,
    sellingPrice: 9.99,
    quantity: 30,
    reorderThreshold: 8,
  },
];
