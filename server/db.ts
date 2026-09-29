import pg from 'pg';
import { config } from './config.ts';
import { hashPassword } from './auth.ts';
import { initialCategories, initialProducts } from './seedData.ts';

const { Pool } = pg;

// Parse numeric/money columns as floats and int8 as numbers
pg.types.setTypeParser(1700, (val: string) => parseFloat(val));
pg.types.setTypeParser(20, (val: string) => parseInt(val, 10));
pg.types.setTypeParser(21, (val: string) => parseInt(val, 10));
pg.types.setTypeParser(23, (val: string) => parseInt(val, 10));

export interface DbStatus {
  connected: boolean;
  provider: 'neon-postgres' | 'in-memory-preview';
  message: string;
  databaseUrlSet: boolean;
}

let pool: pg.Pool | null = null;
let dbStatus: DbStatus = {
  connected: false,
  provider: 'in-memory-preview',
  message: 'Initializing...',
  databaseUrlSet: Boolean(config.databaseUrl),
};

// In-memory fallback state in case DATABASE_URL is not yet provided
interface MemoryUser {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'staff';
  isActive: boolean;
  createdAt: string;
}

interface MemoryCategory {
  id: number;
  name: string;
}

interface MemoryProduct {
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
  createdAt: string;
  updatedAt: string;
}

interface MemorySale {
  id: number;
  staffId: number;
  staffName: string;
  total: number;
  createdAt: string;
}

interface MemorySaleItem {
  id: number;
  saleId: number;
  productId: number;
  productName: string;
  quantity: number;
  priceAtSale: number;
}

class InMemoryStore {
  users: MemoryUser[] = [];
  categories: MemoryCategory[] = [];
  products: MemoryProduct[] = [];
  sales: MemorySale[] = [];
  saleItems: MemorySaleItem[] = [];

  private nextUserId = 1;
  private nextCatId = 1;
  private nextProdId = 1;
  private nextSaleId = 1;
  private nextItemId = 1;

  async seed() {
    if (this.users.length > 0) return;

    const adminHash = await hashPassword('Admin123!');
    const staffHash = await hashPassword('Staff123!');

    this.users.push({
      id: this.nextUserId++,
      name: 'System Admin',
      email: 'admin@example.com',
      passwordHash: adminHash,
      role: 'admin',
      isActive: true,
      createdAt: new Date().toISOString(),
    });

    this.users.push({
      id: this.nextUserId++,
      name: 'Store Staff',
      email: 'staff@example.com',
      passwordHash: staffHash,
      role: 'staff',
      isActive: true,
      createdAt: new Date().toISOString(),
    });

    const categoryMap = new Map<string, number>();
    for (const cat of initialCategories) {
      const id = this.nextCatId++;
      this.categories.push({ id, name: cat.name });
      categoryMap.set(cat.name, id);
    }

    for (const p of initialProducts) {
      const catId = categoryMap.get(p.categoryName) || 1;
      const id = this.nextProdId++;
      const status: 'in_stock' | 'low_stock' | 'out_of_stock' =
        p.quantity <= 0 ? 'out_of_stock' : p.quantity <= p.reorderThreshold ? 'low_stock' : 'in_stock';

      this.products.push({
        id,
        name: p.name,
        sku: p.sku,
        categoryId: catId,
        categoryName: p.categoryName,
        costPrice: p.costPrice,
        sellingPrice: p.sellingPrice,
        quantity: p.quantity,
        reorderThreshold: p.reorderThreshold,
        status,
        createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // Seed ~10 sample sales across past 10 days
    const staff = this.users[1];
    const pastSales = [
      { daysAgo: 9, items: [{ prodIndex: 0, qty: 1 }, { prodIndex: 4, qty: 1 }] },
      { daysAgo: 8, items: [{ prodIndex: 1, qty: 2 }, { prodIndex: 8, qty: 1 }] },
      { daysAgo: 7, items: [{ prodIndex: 2, qty: 1 }] },
      { daysAgo: 6, items: [{ prodIndex: 4, qty: 2 }, { prodIndex: 5, qty: 1 }] },
      { daysAgo: 5, items: [{ prodIndex: 6, qty: 3 }, { prodIndex: 7, qty: 2 }] },
      { daysAgo: 4, items: [{ prodIndex: 8, qty: 2 }, { prodIndex: 9, qty: 1 }] },
      { daysAgo: 3, items: [{ prodIndex: 10, qty: 4 }] },
      { daysAgo: 2, items: [{ prodIndex: 0, qty: 1 }, { prodIndex: 11, qty: 1 }] },
      { daysAgo: 1, items: [{ prodIndex: 12, qty: 2 }, { prodIndex: 13, qty: 1 }] },
      { daysAgo: 0, items: [{ prodIndex: 4, qty: 1 }, { prodIndex: 14, qty: 2 }] },
    ];

    for (const s of pastSales) {
      const saleId = this.nextSaleId++;
      let saleTotal = 0;
      const saleDate = new Date(Date.now() - s.daysAgo * 86400000 + 3600000 * 2).toISOString();

      const itemsForSale: MemorySaleItem[] = [];
      for (const it of s.items) {
        const prod = this.products[it.prodIndex];
        if (!prod) continue;
        const subtotal = Number((prod.sellingPrice * it.qty).toFixed(2));
        saleTotal += subtotal;
        itemsForSale.push({
          id: this.nextItemId++,
          saleId,
          productId: prod.id,
          productName: prod.name,
          quantity: it.qty,
          priceAtSale: prod.sellingPrice,
        });
      }

      this.sales.push({
        id: saleId,
        staffId: staff.id,
        staffName: staff.name,
        total: Number(saleTotal.toFixed(2)),
        createdAt: saleDate,
      });

      this.saleItems.push(...itemsForSale);
    }
  }

  computeStatus(qty: number, threshold: number): 'in_stock' | 'low_stock' | 'out_of_stock' {
    if (qty <= 0) return 'out_of_stock';
    if (qty <= threshold) return 'low_stock';
    return 'in_stock';
  }
}

const memoryStore = new InMemoryStore();

// Initialize Postgres tables and seeds
async function initPostgres(client: pg.PoolClient) {
  // 1. Users
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  // 2. Categories
  await client.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL
    );
  `);

  // 3. Products
  await client.query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      sku TEXT UNIQUE NOT NULL,
      category_id INT NOT NULL REFERENCES categories(id),
      cost_price NUMERIC(12,2) NOT NULL,
      selling_price NUMERIC(12,2) NOT NULL,
      quantity INT NOT NULL DEFAULT 0,
      reorder_threshold INT NOT NULL DEFAULT 5,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  // 4. Sales
  await client.query(`
    CREATE TABLE IF NOT EXISTS sales (
      id SERIAL PRIMARY KEY,
      staff_id INT NOT NULL REFERENCES users(id),
      total NUMERIC(12,2) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  // 5. Sale Items
  await client.query(`
    CREATE TABLE IF NOT EXISTS sale_items (
      id SERIAL PRIMARY KEY,
      sale_id INT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
      product_id INT NOT NULL REFERENCES products(id),
      quantity INT NOT NULL,
      price_at_sale NUMERIC(12,2) NOT NULL
    );
  `);

  // Indexes
  await client.query(`CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);`);

  // Check if admin exists; if not, seed Postgres database
  const adminCheck = await client.query(`SELECT id FROM users WHERE email = 'admin@example.com'`);
  if (adminCheck.rows.length === 0) {
    console.log('Seeding Neon Postgres database with default admin, staff, categories, products, and sales...');
    const adminHash = await hashPassword('Admin123!');
    const staffHash = await hashPassword('Staff123!');

    const adminRes = await client.query(
      `INSERT INTO users (name, email, password_hash, role, is_active) VALUES ($1, $2, $3, $4, true) RETURNING id`,
      ['System Admin', 'admin@example.com', adminHash, 'admin']
    );
    const staffRes = await client.query(
      `INSERT INTO users (name, email, password_hash, role, is_active) VALUES ($1, $2, $3, $4, true) RETURNING id`,
      ['Store Staff', 'staff@example.com', staffHash, 'staff']
    );
    const staffId = staffRes.rows[0].id;

    // Categories
    const categoryIdMap = new Map<string, number>();
    for (const cat of initialCategories) {
      const res = await client.query(
        `INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name RETURNING id`,
        [cat.name]
      );
      categoryIdMap.set(cat.name, res.rows[0].id);
    }

    // Products
    const createdProductIds: { id: number; price: number; name: string }[] = [];
    for (const p of initialProducts) {
      const catId = categoryIdMap.get(p.categoryName) || 1;
      const res = await client.query(
        `INSERT INTO products (name, sku, category_id, cost_price, selling_price, quantity, reorder_threshold, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() - INTERVAL '10 days', NOW())
         ON CONFLICT (sku) DO UPDATE SET quantity = EXCLUDED.quantity
         RETURNING id, selling_price::float AS price, name`,
        [p.name, p.sku, catId, p.costPrice, p.sellingPrice, p.quantity, p.reorderThreshold]
      );
      createdProductIds.push({ id: res.rows[0].id, price: res.rows[0].price, name: res.rows[0].name });
    }

    // Seed ~10 past sales
    if (createdProductIds.length >= 10) {
      const sampleSales = [
        { daysAgo: 9, items: [{ idx: 0, qty: 1 }, { idx: 4, qty: 1 }] },
        { daysAgo: 8, items: [{ idx: 1, qty: 2 }, { idx: 8, qty: 1 }] },
        { daysAgo: 7, items: [{ idx: 2, qty: 1 }] },
        { daysAgo: 6, items: [{ idx: 4, qty: 2 }, { idx: 5, qty: 1 }] },
        { daysAgo: 5, items: [{ idx: 6, qty: 3 }, { idx: 7, qty: 2 }] },
        { daysAgo: 4, items: [{ idx: 8, qty: 2 }, { idx: 9, qty: 1 }] },
        { daysAgo: 3, items: [{ idx: 10, qty: 3 }] },
        { daysAgo: 2, items: [{ idx: 0, qty: 1 }, { idx: 11, qty: 1 }] },
        { daysAgo: 1, items: [{ idx: 12, qty: 2 }, { idx: 13, qty: 1 }] },
        { daysAgo: 0, items: [{ idx: 4, qty: 1 }, { idx: 14, qty: 2 }] },
      ];

      for (const s of sampleSales) {
        let total = 0;
        const items = s.items.map(it => {
          const prod = createdProductIds[it.idx] || createdProductIds[0];
          total += prod.price * it.qty;
          return { productId: prod.id, quantity: it.qty, priceAtSale: prod.price };
        });

        const saleRes = await client.query(
          `INSERT INTO sales (staff_id, total, created_at)
           VALUES ($1, $2, NOW() - ($3 || ' days')::INTERVAL)
           RETURNING id`,
          [staffId, Number(total.toFixed(2)), s.daysAgo]
        );
        const saleId = saleRes.rows[0].id;

        for (const item of items) {
          await client.query(
            `INSERT INTO sale_items (sale_id, product_id, quantity, price_at_sale)
             VALUES ($1, $2, $3, $4)`,
            [saleId, item.productId, item.quantity, item.priceAtSale]
          );
        }
      }
    }
    console.log('Neon Postgres seed complete.');
  }
}

// Connect to Database
export async function initializeDatabase() {
  await memoryStore.seed();

  if (!config.databaseUrl) {
    dbStatus = {
      connected: true,
      provider: 'in-memory-preview',
      message: 'Running in simulated relational preview mode. Add DATABASE_URL secret to connect Neon Postgres.',
      databaseUrlSet: false,
    };
    console.log('DATABASE_URL is not set. Operating in in-memory preview mode.');
    return;
  }

  try {
    const isSslNeeded = config.databaseUrl.includes('neon.tech') || config.databaseUrl.includes('sslmode=require');
    pool = new Pool({
      connectionString: config.databaseUrl,
      ssl: isSslNeeded ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    const client = await pool.connect();
    try {
      await initPostgres(client);
      dbStatus = {
        connected: true,
        provider: 'neon-postgres',
        message: 'Successfully connected to Neon PostgreSQL.',
        databaseUrlSet: true,
      };
      console.log('Successfully connected to Neon PostgreSQL database.');
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('Failed to connect to Postgres using DATABASE_URL:', err.message);
    dbStatus = {
      connected: false,
      provider: 'in-memory-preview',
      message: `Postgres connection error: ${err.message}. Active fallback in place.`,
      databaseUrlSet: true,
    };
  }
}

export function getDbStatus(): DbStatus {
  return dbStatus;
}

// ==========================================
// DATA REPOSITORY FUNCTIONS
// ==========================================

export const db = {
  // --- USERS ---
  async getUserByEmail(email: string) {
    if (pool && dbStatus.provider === 'neon-postgres') {
      const res = await pool.query(
        `SELECT id, name, email, password_hash AS "passwordHash", role, is_active AS "isActive", created_at AS "createdAt"
         FROM users WHERE LOWER(email) = LOWER($1)`,
        [email.trim()]
      );
      return res.rows[0] || null;
    }
    const user = memoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    return user || null;
  },

  async getUserById(id: number) {
    if (pool && dbStatus.provider === 'neon-postgres') {
      const res = await pool.query(
        `SELECT id, name, email, role, is_active AS "isActive", created_at AS "createdAt"
         FROM users WHERE id = $1`,
        [id]
      );
      return res.rows[0] || null;
    }
    const u = memoryStore.users.find(u => u.id === id);
    if (!u) return null;
    return { id: u.id, name: u.name, email: u.email, role: u.role, isActive: u.isActive, createdAt: u.createdAt };
  },

  async listUsers() {
    if (pool && dbStatus.provider === 'neon-postgres') {
      const res = await pool.query(
        `SELECT id, name, email, role, is_active AS "isActive", created_at AS "createdAt"
         FROM users ORDER BY id ASC`
      );
      return res.rows;
    }
    return memoryStore.users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt,
    }));
  },

  async createUser(data: { name: string; email: string; passwordHash: string; role: 'admin' | 'staff' }) {
    if (pool && dbStatus.provider === 'neon-postgres') {
      const res = await pool.query(
        `INSERT INTO users (name, email, password_hash, role, is_active)
         VALUES ($1, $2, $3, $4, true)
         RETURNING id, name, email, role, is_active AS "isActive", created_at AS "createdAt"`,
        [data.name, data.email, data.passwordHash, data.role]
      );
      return res.rows[0];
    }
    const existing = memoryStore.users.find(u => u.email.toLowerCase() === data.email.toLowerCase());
    if (existing) {
      const err: any = new Error('Email already registered');
      err.code = '23505';
      throw err;
    }
    const newUser: MemoryUser = {
      id: memoryStore.users.length + 1,
      name: data.name,
      email: data.email,
      passwordHash: data.passwordHash,
      role: data.role,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    memoryStore.users.push(newUser);
    return {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      isActive: newUser.isActive,
      createdAt: newUser.createdAt,
    };
  },

  async updateUser(id: number, partial: { name?: string; role?: 'admin' | 'staff'; isActive?: boolean; passwordHash?: string }) {
    if (pool && dbStatus.provider === 'neon-postgres') {
      const fields: string[] = [];
      const values: any[] = [];
      let idx = 1;

      if (partial.name !== undefined) {
        fields.push(`name = $${idx++}`);
        values.push(partial.name);
      }
      if (partial.role !== undefined) {
        fields.push(`role = $${idx++}`);
        values.push(partial.role);
      }
      if (partial.isActive !== undefined) {
        fields.push(`is_active = $${idx++}`);
        values.push(partial.isActive);
      }
      if (partial.passwordHash !== undefined) {
        fields.push(`password_hash = $${idx++}`);
        values.push(partial.passwordHash);
      }

      if (fields.length === 0) {
        return this.getUserById(id);
      }

      values.push(id);
      const res = await pool.query(
        `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx}
         RETURNING id, name, email, role, is_active AS "isActive", created_at AS "createdAt"`,
        values
      );
      return res.rows[0] || null;
    }

    const u = memoryStore.users.find(user => user.id === id);
    if (!u) return null;
    if (partial.name !== undefined) u.name = partial.name;
    if (partial.role !== undefined) u.role = partial.role;
    if (partial.isActive !== undefined) u.isActive = partial.isActive;
    if (partial.passwordHash !== undefined) u.passwordHash = partial.passwordHash;

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt,
    };
  },

  // --- CATEGORIES ---
  async listCategories() {
    if (pool && dbStatus.provider === 'neon-postgres') {
      const res = await pool.query(`SELECT id, name FROM categories ORDER BY name ASC`);
      return res.rows;
    }
    return [...memoryStore.categories].sort((a, b) => a.name.localeCompare(b.name));
  },

  async createCategory(name: string) {
    if (pool && dbStatus.provider === 'neon-postgres') {
      const res = await pool.query(
        `INSERT INTO categories (name) VALUES ($1) RETURNING id, name`,
        [name]
      );
      return res.rows[0];
    }
    const existing = memoryStore.categories.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      const err: any = new Error('Category name must be unique');
      err.code = '23505';
      throw err;
    }
    const newCat: MemoryCategory = {
      id: memoryStore.categories.length + 1,
      name,
    };
    memoryStore.categories.push(newCat);
    return newCat;
  },

  // --- PRODUCTS ---
  async listProducts(filters: { search?: string; categoryId?: number; status?: 'in_stock' | 'low_stock' | 'out_of_stock' }) {
    if (pool && dbStatus.provider === 'neon-postgres') {
      let query = `
        SELECT
          p.id,
          p.name,
          p.sku,
          p.category_id AS "categoryId",
          c.name AS "categoryName",
          p.cost_price::float AS "costPrice",
          p.selling_price::float AS "sellingPrice",
          p.quantity,
          p.reorder_threshold AS "reorderThreshold",
          CASE
            WHEN p.quantity <= 0 THEN 'out_of_stock'
            WHEN p.quantity <= p.reorder_threshold THEN 'low_stock'
            ELSE 'in_stock'
          END AS status,
          p.updated_at AS "updatedAt"
        FROM products p
        JOIN categories c ON p.category_id = c.id
        WHERE 1=1
      `;
      const params: any[] = [];
      let idx = 1;

      if (filters.search) {
        query += ` AND (LOWER(p.name) LIKE LOWER($${idx}) OR LOWER(p.sku) LIKE LOWER($${idx}))`;
        params.push(`%${filters.search}%`);
        idx++;
      }

      if (filters.categoryId) {
        query += ` AND p.category_id = $${idx}`;
        params.push(filters.categoryId);
        idx++;
      }

      if (filters.status) {
        if (filters.status === 'out_of_stock') {
          query += ` AND p.quantity <= 0`;
        } else if (filters.status === 'low_stock') {
          query += ` AND p.quantity > 0 AND p.quantity <= p.reorder_threshold`;
        } else if (filters.status === 'in_stock') {
          query += ` AND p.quantity > p.reorder_threshold`;
        }
      }

      query += ` ORDER BY p.id ASC`;
      const res = await pool.query(query, params);
      return res.rows;
    }

    let prods = [...memoryStore.products];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      prods = prods.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    }
    if (filters.categoryId) {
      prods = prods.filter(p => p.categoryId === filters.categoryId);
    }
    if (filters.status) {
      prods = prods.filter(p => p.status === filters.status);
    }
    return prods;
  },

  async getProductById(id: number) {
    if (pool && dbStatus.provider === 'neon-postgres') {
      const res = await pool.query(
        `SELECT
          p.id,
          p.name,
          p.sku,
          p.category_id AS "categoryId",
          c.name AS "categoryName",
          p.cost_price::float AS "costPrice",
          p.selling_price::float AS "sellingPrice",
          p.quantity,
          p.reorder_threshold AS "reorderThreshold",
          CASE
            WHEN p.quantity <= 0 THEN 'out_of_stock'
            WHEN p.quantity <= p.reorder_threshold THEN 'low_stock'
            ELSE 'in_stock'
          END AS status,
          p.updated_at AS "updatedAt"
        FROM products p
        JOIN categories c ON p.category_id = c.id
        WHERE p.id = $1`,
        [id]
      );
      return res.rows[0] || null;
    }
    const p = memoryStore.products.find(prod => prod.id === id);
    return p || null;
  },

  async createProduct(data: {
    name: string;
    sku: string;
    categoryId: number;
    costPrice: number;
    sellingPrice: number;
    quantity: number;
    reorderThreshold: number;
  }) {
    if (pool && dbStatus.provider === 'neon-postgres') {
      const catRes = await pool.query(`SELECT name FROM categories WHERE id = $1`, [data.categoryId]);
      if (catRes.rows.length === 0) {
        const err: any = new Error('Category not found');
        err.statusCode = 404;
        throw err;
      }
      const categoryName = catRes.rows[0].name;

      const res = await pool.query(
        `INSERT INTO products (name, sku, category_id, cost_price, selling_price, quantity, reorder_threshold)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, name, sku, category_id AS "categoryId", cost_price::float AS "costPrice",
                   selling_price::float AS "sellingPrice", quantity, reorder_threshold AS "reorderThreshold",
                   updated_at AS "updatedAt"`,
        [data.name, data.sku, data.categoryId, data.costPrice, data.sellingPrice, data.quantity, data.reorderThreshold]
      );
      const row = res.rows[0];
      const status = row.quantity <= 0 ? 'out_of_stock' : row.quantity <= row.reorderThreshold ? 'low_stock' : 'in_stock';
      return {
        ...row,
        categoryName,
        status,
      };
    }

    const cat = memoryStore.categories.find(c => c.id === data.categoryId);
    if (!cat) {
      const err: any = new Error('Category not found');
      err.statusCode = 404;
      throw err;
    }
    const existing = memoryStore.products.find(p => p.sku.toLowerCase() === data.sku.toLowerCase());
    if (existing) {
      const err: any = new Error('Product SKU already exists');
      err.code = '23505';
      throw err;
    }

    const newProd: MemoryProduct = {
      id: memoryStore.products.length + 1,
      name: data.name,
      sku: data.sku,
      categoryId: data.categoryId,
      categoryName: cat.name,
      costPrice: data.costPrice,
      sellingPrice: data.sellingPrice,
      quantity: data.quantity,
      reorderThreshold: data.reorderThreshold,
      status: memoryStore.computeStatus(data.quantity, data.reorderThreshold),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    memoryStore.products.push(newProd);
    return newProd;
  },

  async updateProduct(id: number, partial: {
    name?: string;
    sku?: string;
    categoryId?: number;
    costPrice?: number;
    sellingPrice?: number;
    quantity?: number;
    reorderThreshold?: number;
  }) {
    if (pool && dbStatus.provider === 'neon-postgres') {
      const fields: string[] = [];
      const values: any[] = [];
      let idx = 1;

      if (partial.name !== undefined) {
        fields.push(`name = $${idx++}`);
        values.push(partial.name);
      }
      if (partial.sku !== undefined) {
        fields.push(`sku = $${idx++}`);
        values.push(partial.sku);
      }
      if (partial.categoryId !== undefined) {
        fields.push(`category_id = $${idx++}`);
        values.push(partial.categoryId);
      }
      if (partial.costPrice !== undefined) {
        fields.push(`cost_price = $${idx++}`);
        values.push(partial.costPrice);
      }
      if (partial.sellingPrice !== undefined) {
        fields.push(`selling_price = $${idx++}`);
        values.push(partial.sellingPrice);
      }
      if (partial.quantity !== undefined) {
        fields.push(`quantity = $${idx++}`);
        values.push(partial.quantity);
      }
      if (partial.reorderThreshold !== undefined) {
        fields.push(`reorder_threshold = $${idx++}`);
        values.push(partial.reorderThreshold);
      }

      fields.push(`updated_at = NOW()`);
      values.push(id);

      const res = await pool.query(
        `UPDATE products SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id`,
        values
      );
      if (res.rows.length === 0) return null;
      return this.getProductById(id);
    }

    const prod = memoryStore.products.find(p => p.id === id);
    if (!prod) return null;

    if (partial.categoryId !== undefined && partial.categoryId !== prod.categoryId) {
      const cat = memoryStore.categories.find(c => c.id === partial.categoryId);
      if (!cat) {
        const err: any = new Error('Category not found');
        err.statusCode = 404;
        throw err;
      }
      prod.categoryId = cat.id;
      prod.categoryName = cat.name;
    }

    if (partial.name !== undefined) prod.name = partial.name;
    if (partial.sku !== undefined) prod.sku = partial.sku;
    if (partial.costPrice !== undefined) prod.costPrice = partial.costPrice;
    if (partial.sellingPrice !== undefined) prod.sellingPrice = partial.sellingPrice;
    if (partial.quantity !== undefined) prod.quantity = partial.quantity;
    if (partial.reorderThreshold !== undefined) prod.reorderThreshold = partial.reorderThreshold;

    prod.status = memoryStore.computeStatus(prod.quantity, prod.reorderThreshold);
    prod.updatedAt = new Date().toISOString();
    return prod;
  },

  async deleteProduct(id: number) {
    if (pool && dbStatus.provider === 'neon-postgres') {
      const res = await pool.query(`DELETE FROM products WHERE id = $1 RETURNING id`, [id]);
      return res.rowCount !== null && res.rowCount > 0;
    }
    const idx = memoryStore.products.findIndex(p => p.id === id);
    if (idx === -1) return false;
    memoryStore.products.splice(idx, 1);
    return true;
  },

  // --- SALES TRANSACTION ---
  async createSale(staffId: number, items: Array<{ productId: number; quantity: number }>) {
    if (pool && dbStatus.provider === 'neon-postgres') {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        let grandTotal = 0;
        const verifiedItems: Array<{
          productId: number;
          productName: string;
          quantity: number;
          priceAtSale: number;
        }> = [];

        // 1. Lock each product row with SELECT ... FOR UPDATE
        for (const item of items) {
          const prodRes = await client.query(
            `SELECT id, name, quantity, selling_price::float AS "sellingPrice"
             FROM products WHERE id = $1 FOR UPDATE`,
            [item.productId]
          );

          if (prodRes.rows.length === 0) {
            const err: any = new Error(`Product #${item.productId} not found`);
            err.statusCode = 404;
            throw err;
          }

          const product = prodRes.rows[0];
          if (product.quantity < item.quantity) {
            const err: any = new Error(
              `Insufficient stock for "${product.name}": requested ${item.quantity}, only ${product.quantity} available.`
            );
            err.statusCode = 409;
            throw err;
          }

          const priceAtSale = product.sellingPrice;
          grandTotal += priceAtSale * item.quantity;
          verifiedItems.push({
            productId: product.id,
            productName: product.name,
            quantity: item.quantity,
            priceAtSale,
          });
        }

        // 2. Deduct stock for each product
        for (const item of verifiedItems) {
          await client.query(
            `UPDATE products
             SET quantity = quantity - $1, updated_at = NOW()
             WHERE id = $2`,
            [item.quantity, item.productId]
          );
        }

        // 3. Insert sale
        const saleRes = await client.query(
          `INSERT INTO sales (staff_id, total, created_at)
           VALUES ($1, $2, NOW())
           RETURNING id, staff_id AS "staffId", total::float, created_at AS "createdAt"`,
          [staffId, Number(grandTotal.toFixed(2))]
        );
        const sale = saleRes.rows[0];

        // 4. Insert sale items
        const insertedItems: Array<{
          id: number;
          saleId: number;
          productId: number;
          productName: string;
          quantity: number;
          priceAtSale: number;
        }> = [];

        for (const item of verifiedItems) {
          const itemRes = await client.query(
            `INSERT INTO sale_items (sale_id, product_id, quantity, price_at_sale)
             VALUES ($1, $2, $3, $4)
             RETURNING id, sale_id AS "saleId", product_id AS "productId", quantity, price_at_sale::float AS "priceAtSale"`,
            [sale.id, item.productId, item.quantity, item.priceAtSale]
          );
          insertedItems.push({
            ...itemRes.rows[0],
            productName: item.productName,
          });
        }

        await client.query('COMMIT');
        return {
          sale,
          items: insertedItems,
        };
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }

    // In-memory atomic transaction simulation
    const staff = memoryStore.users.find(u => u.id === staffId);
    let total = 0;
    const verifiedItems: Array<{
      product: MemoryProduct;
      quantity: number;
      priceAtSale: number;
    }> = [];

    // Verify all stock atomically
    for (const item of items) {
      const prod = memoryStore.products.find(p => p.id === item.productId);
      if (!prod) {
        const err: any = new Error(`Product #${item.productId} not found`);
        err.statusCode = 404;
        throw err;
      }

      if (prod.quantity < item.quantity) {
        const err: any = new Error(
          `Insufficient stock for "${prod.name}": requested ${item.quantity}, only ${prod.quantity} available.`
        );
        err.statusCode = 409;
        throw err;
      }

      total += prod.sellingPrice * item.quantity;
      verifiedItems.push({
        product: prod,
        quantity: item.quantity,
        priceAtSale: prod.sellingPrice,
      });
    }

    // Deduct stock
    for (const v of verifiedItems) {
      v.product.quantity -= v.quantity;
      v.product.status = memoryStore.computeStatus(v.product.quantity, v.product.reorderThreshold);
      v.product.updatedAt = new Date().toISOString();
    }

    const saleId = memoryStore.sales.length + 1;
    const createdAt = new Date().toISOString();
    const newSale: MemorySale = {
      id: saleId,
      staffId,
      staffName: staff?.name || 'Staff User',
      total: Number(total.toFixed(2)),
      createdAt,
    };
    memoryStore.sales.push(newSale);

    const insertedItems = verifiedItems.map(v => {
      const itemRecord: MemorySaleItem = {
        id: memoryStore.saleItems.length + 1,
        saleId,
        productId: v.product.id,
        productName: v.product.name,
        quantity: v.quantity,
        priceAtSale: v.priceAtSale,
      };
      memoryStore.saleItems.push(itemRecord);
      return itemRecord;
    });

    return {
      sale: {
        id: newSale.id,
        staffId: newSale.staffId,
        total: newSale.total,
        createdAt: newSale.createdAt,
      },
      items: insertedItems,
    };
  },

  async listSales(from?: string, to?: string) {
    if (pool && dbStatus.provider === 'neon-postgres') {
      let query = `
        SELECT
          s.id,
          s.total::float,
          s.created_at AS "createdAt",
          u.name AS "staffName"
        FROM sales s
        JOIN users u ON s.staff_id = u.id
        WHERE 1=1
      `;
      const params: any[] = [];
      let idx = 1;

      if (from) {
        query += ` AND s.created_at >= $${idx++}::timestamp`;
        params.push(from);
      }
      if (to) {
        // add one day or include timestamp
        query += ` AND s.created_at <= ($${idx++}::timestamp + INTERVAL '1 day')`;
        params.push(to);
      }

      query += ` ORDER BY s.created_at DESC, s.id DESC`;
      const res = await pool.query(query, params);
      return res.rows;
    }

    let sales = [...memoryStore.sales];
    if (from) {
      const fromDate = new Date(from).getTime();
      sales = sales.filter(s => new Date(s.createdAt).getTime() >= fromDate);
    }
    if (to) {
      const toDate = new Date(to).getTime() + 86400000;
      sales = sales.filter(s => new Date(s.createdAt).getTime() <= toDate);
    }

    return sales
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(s => ({
        id: s.id,
        total: s.total,
        createdAt: s.createdAt,
        staffName: s.staffName,
      }));
  },

  async getSaleById(id: number) {
    if (pool && dbStatus.provider === 'neon-postgres') {
      const saleRes = await pool.query(
        `SELECT
          s.id,
          s.total::float,
          s.created_at AS "createdAt",
          u.name AS "staffName"
        FROM sales s
        JOIN users u ON s.staff_id = u.id
        WHERE s.id = $1`,
        [id]
      );

      if (saleRes.rows.length === 0) return null;
      const sale = saleRes.rows[0];

      const itemsRes = await pool.query(
        `SELECT
          si.product_id AS "productId",
          p.name AS "productName",
          si.quantity,
          si.price_at_sale::float AS "priceAtSale"
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        WHERE si.sale_id = $1
        ORDER BY si.id ASC`,
        [id]
      );

      return {
        ...sale,
        items: itemsRes.rows,
      };
    }

    const sale = memoryStore.sales.find(s => s.id === id);
    if (!sale) return null;
    const items = memoryStore.saleItems
      .filter(it => it.saleId === id)
      .map(it => ({
        productId: it.productId,
        productName: it.productName,
        quantity: it.quantity,
        priceAtSale: it.priceAtSale,
      }));

    return {
      id: sale.id,
      total: sale.total,
      createdAt: sale.createdAt,
      staffName: sale.staffName,
      items,
    };
  },

  // --- REPORTS ---
  async getDashboardReport() {
    if (pool && dbStatus.provider === 'neon-postgres') {
      const countsRes = await pool.query(`
        SELECT
          COUNT(*)::int AS "totalProducts",
          COALESCE(SUM(quantity * cost_price)::float, 0) AS "totalStockValue",
          COUNT(CASE WHEN quantity > 0 AND quantity <= reorder_threshold THEN 1 END)::int AS "lowStockCount",
          COUNT(CASE WHEN quantity <= 0 THEN 1 END)::int AS "outOfStockCount"
        FROM products
      `);

      const todayRes = await pool.query(`
        SELECT COALESCE(SUM(total)::float, 0) AS "todaysSales"
        FROM sales
        WHERE created_at >= CURRENT_DATE
      `);

      const alertsRes = await pool.query(`
        SELECT id, name, quantity, reorder_threshold AS "reorderThreshold"
        FROM products
        WHERE quantity <= reorder_threshold
        ORDER BY quantity ASC, name ASC
        LIMIT 10
      `);

      // Last 7 days trend
      const trendRes = await pool.query(`
        WITH days AS (
          SELECT to_char(d::date, 'YYYY-MM-DD') AS day_date
          FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day'::interval) d
        )
        SELECT
          days.day_date AS date,
          COALESCE(SUM(s.total)::float, 0) AS total
        FROM days
        LEFT JOIN sales s ON to_char(s.created_at, 'YYYY-MM-DD') = days.day_date
        GROUP BY days.day_date
        ORDER BY days.day_date ASC
      `);

      return {
        totalProducts: countsRes.rows[0]?.totalProducts || 0,
        totalStockValue: countsRes.rows[0]?.totalStockValue || 0,
        todaysSales: todayRes.rows[0]?.todaysSales || 0,
        lowStockCount: countsRes.rows[0]?.lowStockCount || 0,
        outOfStockCount: countsRes.rows[0]?.outOfStockCount || 0,
        lowStockAlerts: alertsRes.rows,
        salesTrend: trendRes.rows,
      };
    }

    // In-memory dashboard calculation
    const totalProducts = memoryStore.products.length;
    const totalStockValue = Number(
      memoryStore.products.reduce((acc, p) => acc + p.quantity * p.costPrice, 0).toFixed(2)
    );
    const lowStockAlerts = memoryStore.products
      .filter(p => p.quantity <= p.reorderThreshold)
      .map(p => ({
        id: p.id,
        name: p.name,
        quantity: p.quantity,
        reorderThreshold: p.reorderThreshold,
      }))
      .sort((a, b) => a.quantity - b.quantity);

    const lowStockCount = memoryStore.products.filter(p => p.quantity > 0 && p.quantity <= p.reorderThreshold).length;
    const outOfStockCount = memoryStore.products.filter(p => p.quantity <= 0).length;

    // Today's sales
    const todayStr = new Date().toISOString().slice(0, 10);
    const todaysSales = Number(
      memoryStore.sales
        .filter(s => s.createdAt.slice(0, 10) === todayStr)
        .reduce((sum, s) => sum + s.total, 0)
        .toFixed(2)
    );

    // 7-day sales trend
    const salesTrend: Array<{ date: string; total: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dateKey = d.toISOString().slice(0, 10);
      const total = Number(
        memoryStore.sales
          .filter(s => s.createdAt.slice(0, 10) === dateKey)
          .reduce((sum, s) => sum + s.total, 0)
          .toFixed(2)
      );
      salesTrend.push({ date: dateKey, total });
    }

    return {
      totalProducts,
      totalStockValue,
      todaysSales,
      lowStockCount,
      outOfStockCount,
      lowStockAlerts,
      salesTrend,
    };
  },

  async getSalesReport(from?: string, to?: string) {
    if (pool && dbStatus.provider === 'neon-postgres') {
      let salesWhere = 'WHERE 1=1';
      const params: any[] = [];
      let idx = 1;

      if (from) {
        salesWhere += ` AND s.created_at >= $${idx++}::timestamp`;
        params.push(from);
      }
      if (to) {
        salesWhere += ` AND s.created_at <= ($${idx++}::timestamp + INTERVAL '1 day')`;
        params.push(to);
      }

      const summaryRes = await pool.query(
        `SELECT
          COALESCE(SUM(s.total)::float, 0) AS "totalRevenue",
          COUNT(s.id)::int AS "totalTransactions"
        FROM sales s
        ${salesWhere}`,
        params
      );

      const bestSellersRes = await pool.query(
        `SELECT
          si.product_id AS "productId",
          p.name AS "productName",
          SUM(si.quantity)::int AS "unitsSold",
          SUM(si.quantity * si.price_at_sale)::float AS "revenue"
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        JOIN products p ON si.product_id = p.id
        ${salesWhere}
        GROUP BY si.product_id, p.name
        ORDER BY "unitsSold" DESC
        LIMIT 10`,
        params
      );

      return {
        totalRevenue: summaryRes.rows[0]?.totalRevenue || 0,
        totalTransactions: summaryRes.rows[0]?.totalTransactions || 0,
        bestSellers: bestSellersRes.rows,
      };
    }

    let sales = [...memoryStore.sales];
    if (from) {
      const fromTime = new Date(from).getTime();
      sales = sales.filter(s => new Date(s.createdAt).getTime() >= fromTime);
    }
    if (to) {
      const toTime = new Date(to).getTime() + 86400000;
      sales = sales.filter(s => new Date(s.createdAt).getTime() <= toTime);
    }

    const saleIds = new Set(sales.map(s => s.id));
    const relevantItems = memoryStore.saleItems.filter(it => saleIds.has(it.saleId));

    const totalRevenue = Number(sales.reduce((acc, s) => acc + s.total, 0).toFixed(2));
    const totalTransactions = sales.length;

    const productMap = new Map<number, { productId: number; productName: string; unitsSold: number; revenue: number }>();
    for (const it of relevantItems) {
      const curr = productMap.get(it.productId) || {
        productId: it.productId,
        productName: it.productName,
        unitsSold: 0,
        revenue: 0,
      };
      curr.unitsSold += it.quantity;
      curr.revenue += Number((it.quantity * it.priceAtSale).toFixed(2));
      productMap.set(it.productId, curr);
    }

    const bestSellers = Array.from(productMap.values())
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 10);

    return {
      totalRevenue,
      totalTransactions,
      bestSellers,
    };
  },

  async getStockReport() {
    if (pool && dbStatus.provider === 'neon-postgres') {
      const valRes = await pool.query(`
        SELECT COALESCE(SUM(quantity * cost_price)::float, 0) AS "totalValuation"
        FROM products
      `);

      const lowStockRes = await pool.query(`
        SELECT id, name, quantity, reorder_threshold AS "reorderThreshold"
        FROM products
        WHERE quantity > 0 AND quantity <= reorder_threshold
        ORDER BY quantity ASC
      `);

      const outOfStockRes = await pool.query(`
        SELECT id, name
        FROM products
        WHERE quantity <= 0
        ORDER BY name ASC
      `);

      return {
        totalValuation: valRes.rows[0]?.totalValuation || 0,
        lowStock: lowStockRes.rows,
        outOfStock: outOfStockRes.rows,
      };
    }

    const totalValuation = Number(
      memoryStore.products.reduce((acc, p) => acc + p.quantity * p.costPrice, 0).toFixed(2)
    );

    const lowStock = memoryStore.products
      .filter(p => p.quantity > 0 && p.quantity <= p.reorderThreshold)
      .map(p => ({
        id: p.id,
        name: p.name,
        quantity: p.quantity,
        reorderThreshold: p.reorderThreshold,
      }))
      .sort((a, b) => a.quantity - b.quantity);

    const outOfStock = memoryStore.products
      .filter(p => p.quantity <= 0)
      .map(p => ({
        id: p.id,
        name: p.name,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      totalValuation,
      lowStock,
      outOfStock,
    };
  },
};
