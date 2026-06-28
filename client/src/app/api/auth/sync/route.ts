import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { id, email, username, imageUrl } = await req.json();
    if (!id) return NextResponse.json({ error: "No ID provided" }, { status: 400 });

    // 🔥 FIX: Kabhi null insert nahi hone denge
    const safeUsername = username || `User${Math.floor(1000 + Math.random() * 9000)}`;

    const existingUser = await db.query(`SELECT * FROM "User" WHERE id = $1`, [id]);

    if (existingUser.rows.length > 0) {
      let userRecord = existingUser.rows[0];

      // Agar purane user ka naam kisi wajah se khali reh gaya tha, toh bhar do
      if (!userRecord.username && safeUsername) {
        await db.query(`UPDATE "User" SET username = $1 WHERE id = $2`, [safeUsername, id]);
        userRecord.username = safeUsername;
      }

      return NextResponse.json({ success: true, user: userRecord, isNew: false });
    } else {
      // Naya User Insert
      await db.query(`
        INSERT INTO "User" (id, email, username, "imageUrl")
        VALUES ($1, $2, $3, $4)
      `, [id, email || "", safeUsername, imageUrl || ""]);
      
      return NextResponse.json({ 
        success: true, 
        isNew: true, 
        user: { id, email, username: safeUsername, imageUrl: imageUrl } 
      });
    }
  } catch (error) {
    console.error("DB Sync Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, username } = await req.json();
    if (!id || !username) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    await db.query(`UPDATE "User" SET username = $1 WHERE id = $2`, [username, id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DB Update Error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}