import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { config } from './server/config.ts';
import { initializeDatabase } from './server/db.ts';
import authRoutes from './server/routes/auth.ts';
import productRoutes from './server/routes/products.ts';
import categoryRoutes from './server/routes/categories.ts';
import saleRoutes from './server/routes/sales.ts';
import reportRoutes from './server/routes/reports.ts';
import userRoutes from './server/routes/users.ts';
import systemRoutes from './server/routes/system.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = config.port || 3000;

  // Initialize DB tables and seed data
  await initializeDatabase();

  app.use(cors());
  app.use(express.json());

  // Mount API endpoints matching contract
  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/sales', saleRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/system', systemRoutes);

  // Fallback for API
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API route ${req.method} ${req.path} not found` });
  });

  // In production serve dist, otherwise use Vite middleware
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Inventory Management Server running on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal server boot error:', err);
  process.exit(1);
});
