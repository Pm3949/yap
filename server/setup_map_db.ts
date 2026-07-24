import "dotenv/config";
import { query } from "./lib/db.ts";

async function setup() {
  try {
    console.log("Checking DB connection and PostGIS...");
    await query(`CREATE EXTENSION IF NOT EXISTS postgis;`);
    console.log("PostGIS ready.");
    
    await query(`
      CREATE TABLE IF NOT EXISTS "MapCluster" (
        id VARCHAR(255) PRIMARY KEY,
        location geography(Point, 4326),
        lat FLOAT,
        lng FLOAT,
        "activeUsers" INT DEFAULT 1,
        topic VARCHAR(255),
        "isLocked" BOOLEAN DEFAULT FALSE,
        "creatorId" VARCHAR(255),
        type VARCHAR(50) DEFAULT 'room',
        "isPrivate" BOOLEAN DEFAULT FALSE,
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
      
      -- Add new columns safely in case the table already exists
      ALTER TABLE "MapCluster" ADD COLUMN IF NOT EXISTS topic VARCHAR(255);
      ALTER TABLE "MapCluster" ADD COLUMN IF NOT EXISTS "isLocked" BOOLEAN DEFAULT FALSE;
      ALTER TABLE "MapCluster" ADD COLUMN IF NOT EXISTS "creatorId" VARCHAR(255);
      ALTER TABLE "MapCluster" ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'room';
      ALTER TABLE "MapCluster" ADD COLUMN IF NOT EXISTS "isPrivate" BOOLEAN DEFAULT FALSE;
    `);
    console.log("MapCluster table ready.");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

setup();
