// server/lib/db.ts
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Neon cloud ke liye zaroori hai
  }
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
export default pool;