// src/lib/db.ts
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Neon cloud connections
  }
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
export const db = pool;
export default pool;