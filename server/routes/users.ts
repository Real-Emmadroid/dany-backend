import { Router, Request, Response } from 'express';
import { db } from '../db.ts';
import { authenticateToken, requireAdmin, hashPassword } from '../auth.ts';
import { validateBody, userCreateSchema, userUpdateSchema } from '../validation.ts';

const router = Router();

// GET /api/users (admin only)
router.get('/', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const users = await db.listUsers();
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch users' });
  }
});

// POST /api/users (admin only)
router.post('/', authenticateToken, requireAdmin, validateBody(userCreateSchema), async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;
    const passwordHash = await hashPassword(password);

    const created = await db.createUser({
      name,
      email,
      passwordHash,
      role,
    });

    res.status(201).json(created);
  } catch (err: any) {
    if (err.code === '23505') {
      res.status(409).json({ error: 'A user with this email address already exists' });
      return;
    }
    res.status(500).json({ error: err.message || 'Failed to create user' });
  }
});

// PATCH /api/users/:id (admin only)
router.patch('/:id', authenticateToken, requireAdmin, validateBody(userUpdateSchema), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    const { name, role, isActive, password } = req.body;
    const updatePayload: { name?: string; role?: 'admin' | 'staff'; isActive?: boolean; passwordHash?: string } = {};

    if (name !== undefined) updatePayload.name = name;
    if (role !== undefined) updatePayload.role = role;
    if (isActive !== undefined) updatePayload.isActive = isActive;
    if (password !== undefined) {
      updatePayload.passwordHash = await hashPassword(password);
    }

    const updated = await db.updateUser(id, updatePayload);
    if (!updated) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update user' });
  }
});

export default router;
