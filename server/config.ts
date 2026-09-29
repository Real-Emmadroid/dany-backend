import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'inventory-mgmt-jwt-secret-key-32chars-minimum-2026',
  jwtExpiresIn: '12h',
  isProduction: process.env.NODE_ENV === 'production',
};
