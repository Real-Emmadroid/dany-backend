import { Router, Request, Response } from 'express';
import { db } from '../db.ts';
import { comparePassword, signJwt, authenticateToken } from '../auth.ts';
import { validateBody, loginSchema } from '../validation.ts';

const router = Router();

// POST /api/auth/login
router.post('/login', validateBody(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await db.getUserByEmail(email);

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    if (!user.isActive) {
      res.status(401).json({ error: 'Account has been deactivated. Please contact an administrator.' });
      return;
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const authUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const token = signJwt(authUser);

    res.json({
      token,
      user: authUser,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = await db.getUserById(req.user.id);
    if (!user || !user.isActive) {
      res.status(401).json({ error: 'User no longer active or found' });
      return;
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

export default router;
