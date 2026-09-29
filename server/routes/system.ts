import { Router, Request, Response } from 'express';
import { getDbStatus, initializeDatabase } from '../db.ts';

const router = Router();

// GET /api/system/status
router.get('/status', (req: Request, res: Response) => {
  const status = getDbStatus();
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    database: status,
  });
});

// POST /api/system/reconnect
router.post('/reconnect', async (req: Request, res: Response) => {
  try {
    await initializeDatabase();
    res.json({
      message: 'Database connection refreshed',
      database: getDbStatus(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to reconnect database' });
  }
});

export default router;
