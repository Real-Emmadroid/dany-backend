import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodIssue } from 'zod';

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.issues.map((err: ZodIssue) => ({
        path: err.path.join('.'),
        message: err.message,
      }));
      res.status(422).json({
        error: details.length > 0 ? details[0].message : 'Validation failed',
        details,
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

export const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const productCreateSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().min(1, 'SKU is required'),
  categoryId: z.coerce.number().int().positive('Category ID must be a positive integer'),
  costPrice: z.coerce.number().min(0, 'Cost price must be non-negative'),
  sellingPrice: z.coerce.number().min(0, 'Selling price must be non-negative'),
  quantity: z.coerce.number().int().min(0, 'Quantity cannot be negative').default(0),
  reorderThreshold: z.coerce.number().int().min(0, 'Reorder threshold cannot be negative').default(5),
});

export const productUpdateSchema = z.object({
  name: z.string().min(1, 'Product name cannot be empty').optional(),
  sku: z.string().min(1, 'SKU cannot be empty').optional(),
  categoryId: z.coerce.number().int().positive('Category ID must be positive').optional(),
  costPrice: z.coerce.number().min(0, 'Cost price must be non-negative').optional(),
  sellingPrice: z.coerce.number().min(0, 'Selling price must be non-negative').optional(),
  quantity: z.coerce.number().int().min(0, 'Quantity cannot be negative').optional(),
  reorderThreshold: z.coerce.number().int().min(0, 'Reorder threshold cannot be negative').optional(),
});

export const categoryCreateSchema = z.object({
  name: z.string().min(1, 'Category name is required').trim(),
});

export const saleItemSchema = z.object({
  productId: z.coerce.number().int().positive('Product ID is required'),
  quantity: z.coerce.number().int().positive('Quantity must be at least 1'),
});

export const saleCreateSchema = z.object({
  items: z.array(saleItemSchema).min(1, 'Sale must contain at least one item'),
});

export const userCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  email: z.string().email('Valid email is required').toLowerCase().trim(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'staff']).default('staff'),
});

export const userUpdateSchema = z.object({
  name: z.string().min(1).trim().optional(),
  role: z.enum(['admin', 'staff']).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6).optional(),
});
