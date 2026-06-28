import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await db.query(`DELETE FROM "User" WHERE id = $1`, [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DB Delete Error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}