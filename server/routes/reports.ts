import { Router, Request, Response } from 'express';
import { db } from '../db.ts';
import { authenticateToken, requireAdmin } from '../auth.ts';

const router = Router();

// GET /api/reports/dashboard -> { totalProducts, totalStockValue, todaysSales, lowStockCount, outOfStockCount, lowStockAlerts: [{id,name,quantity,reorderThreshold}], salesTrend: [{date:"YYYY-MM-DD", total}] } for the last 7 days
router.get('/dashboard', authenticateToken, async (req: Request, res: Response) => {
  try {
    const report = await db.getDashboardReport();
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate dashboard report' });
  }
});

// GET /api/reports/sales?from=&to= (admin only) -> { totalRevenue, totalTransactions, bestSellers: [{productId,productName,unitsSold,revenue}] }
router.get('/sales', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const from = req.query.from ? String(req.query.from) : undefined;
    const to = req.query.to ? String(req.query.to) : undefined;

    const report = await db.getSalesReport(from, to);
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate sales report' });
  }
});

// GET /api/reports/stock (admin only) -> { totalValuation, lowStock: [{id,name,quantity,reorderThreshold}], outOfStock: [{id,name}] }
router.get('/stock', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const report = await db.getStockReport();
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate stock report' });
  }
});

export default router;
