import "dotenv/config";
import { query } from "./lib/db.ts";

async function check() {
  try {
    const res = await query(`SELECT * FROM "MapCluster"`);
    console.log("MapCluster rows:");
    console.log(JSON.stringify(res.rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();
