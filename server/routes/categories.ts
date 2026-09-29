import { Router, Request, Response } from 'express';
import { db } from '../db.ts';
import { authenticateToken, requireAdmin } from '../auth.ts';
import { validateBody, categoryCreateSchema } from '../validation.ts';

const router = Router();

// GET /api/categories -> array of { id, name }
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const categories = await db.listCategories();
    res.json(categories);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch categories' });
  }
});

// POST /api/categories (admin only) { name } -> created category, 201
router.post('/', authenticateToken, requireAdmin, validateBody(categoryCreateSchema), async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const created = await db.createCategory(name);
    res.status(201).json(created);
  } catch (err: any) {
    if (err.code === '23505') {
      res.status(409).json({ error: 'A category with this name already exists' });
      return;
    }
    res.status(500).json({ error: err.message || 'Failed to create category' });
  }
});

export default router;
