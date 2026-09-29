import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from './config.ts';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'staff';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function hashPassword(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signJwt(user: AuthUser): string {
  const payload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
  const options: SignOptions = {
    expiresIn: '12h',
  };
  return jwt.sign(payload, config.jwtSecret, options);
}

export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    res.status(401).json({ error: 'Authorization header with Bearer token is required' });
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({ error: 'Invalid authorization format. Format must be: Bearer <token>' });
    return;
  }

  const token = parts[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as AuthUser;
    req.user = {
      id: decoded.id,
      name: decoded.name,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired authentication token' });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden: Admin access required' });
    return;
  }

  next();
}
