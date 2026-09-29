import { Router, Request, Response } from 'express';
import { db } from '../db.ts';
import { authenticateToken, requireAdmin } from '../auth.ts';
import { validateBody, productCreateSchema, productUpdateSchema } from '../validation.ts';

const router = Router();

// GET /api/products?search=&categoryId=&status=(in_stock|low_stock|out_of_stock)
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const search = req.query.search ? String(req.query.search).trim() : undefined;
    const categoryId = req.query.categoryId ? parseInt(String(req.query.categoryId), 10) : undefined;
    const statusParam = req.query.status ? String(req.query.status) : undefined;

    let status: 'in_stock' | 'low_stock' | 'out_of_stock' | undefined;
    if (statusParam === 'in_stock' || statusParam === 'low_stock' || statusParam === 'out_of_stock') {
      status = statusParam;
    }

    const products = await db.listProducts({
      search,
      categoryId: isNaN(categoryId as number) ? undefined : categoryId,
      status,
    });

    res.json(products);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// POST /api/products (admin only)
router.post('/', authenticateToken, requireAdmin, validateBody(productCreateSchema), async (req: Request, res: Response) => {
  try {
    const created = await db.createProduct(req.body);
    res.status(201).json(created);
  } catch (err: any) {
    if (err.statusCode) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    if (err.code === '23505') {
      res.status(409).json({ error: 'Product SKU already exists' });
      return;
    }
    res.status(500).json({ error: err.message || 'Failed to create product' });
  }
});

// PUT /api/products/:id (admin only)
router.put('/:id', authenticateToken, requireAdmin, validateBody(productUpdateSchema), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid product ID' });
      return;
    }

    const updated = await db.updateProduct(id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.json(updated);
  } catch (err: any) {
    if (err.statusCode) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    if (err.code === '23505') {
      res.status(409).json({ error: 'Product SKU already in use by another product' });
      return;
    }
    res.status(500).json({ error: err.message || 'Failed to update product' });
  }
});

// DELETE /api/products/:id (admin only) -> 204
router.delete('/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid product ID' });
      return;
    }

    const deleted = await db.deleteProduct(id);
    if (!deleted) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete product' });
  }
});

export default router;
