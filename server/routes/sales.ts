import { Router, Request, Response } from 'express';
import { db } from '../db.ts';
import { authenticateToken } from '../auth.ts';
import { validateBody, saleCreateSchema } from '../validation.ts';

const router = Router();

// POST /api/sales { items: [{productId, quantity}] }
router.post('/', authenticateToken, validateBody(saleCreateSchema), async (req: Request, res: Response) => {
  try {
    const staffId = req.user!.id;
    const { items } = req.body;

    const result = await db.createSale(staffId, items);
    res.status(201).json(result);
  } catch (err: any) {
    if (err.statusCode === 409) {
      res.status(409).json({ error: err.message });
      return;
    }
    if (err.statusCode === 404) {
      res.status(404).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: err.message || 'Failed to process sale' });
  }
});

// GET /api/sales?from=&to= -> array of { id, total, createdAt, staffName }, newest first
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const from = req.query.from ? String(req.query.from) : undefined;
    const to = req.query.to ? String(req.query.to) : undefined;

    const sales = await db.listSales(from, to);
    res.json(sales);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch sales' });
  }
});

// GET /api/sales/:id -> { id, total, createdAt, staffName, items: [{productId,productName,quantity,priceAtSale}] }
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid sale ID' });
      return;
    }

    const sale = await db.getSaleById(id);
    if (!sale) {
      res.status(404).json({ error: 'Sale not found' });
      return;
    }

    res.json(sale);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch sale details' });
  }
});

export default router;
