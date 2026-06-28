// server/api.ts
import { Router } from "express";
import { query } from "./lib/db.ts"; // Use the new query helper

const router = Router();

router.get("/friends/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    // Native SQL query to fetch friends and inject friendshipId
    const result = await query(
      `SELECT u.*, f.id as "friendshipId"
       FROM "User" u
       JOIN "Friendship" f ON (f."userAId" = u.id OR f."userBId" = u.id)
       WHERE (f."userAId" = $1 OR f."userBId" = $1)
       AND u.id != $1
       AND f.level = 'LEVEL_1'`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching friends:", error);
    res.status(500).json({ error: "Failed to fetch friends" });
  }
});

router.get("/messages/:friendshipId", async (req, res) => {
  try {
    const { friendshipId } = req.params;
    const cursor = req.query.cursor;
    
    let sql = `SELECT * FROM "Message" WHERE "friendshipId" = $1`;
    let params = [friendshipId];

    if (cursor) {
      sql += ` AND "id" > $2`;
      params.push(cursor);
    }

    sql += ` ORDER BY "sentAt" ASC LIMIT 50`;
    
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

export default router;


// // server/api.ts
// import { Router } from "express";
// import { prisma } from "./lib/db";

// const router = Router();

// // 1. Fetch Friends List
// router.get("/friends/:userId", async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const friendships = await prisma.friendship.findMany({
//       where: { OR: [{ userAId: userId }, { userBId: userId }], level: "LEVEL_1" },
//       include: { userA: true, userB: true },
//     });

//     const friendsList = friendships.map((f) => {
//       const friendDetails = f.userAId === userId ? f.userB : f.userA;
//       return { ...friendDetails, friendshipId: f.id };
//     });

//     res.json(friendsList);
//   } catch (error) {
//     console.error("Error fetching friends:", error);
//     res.status(500).json({ error: "Failed to fetch friends" });
//   }
// });

// // 2. Fetch Chat History (with Pagination)
// router.get("/messages/:friendshipId", async (req, res) => {
//   try {
//     const { friendshipId } = req.params;
//     const cursor = req.query.cursor as string | undefined;

//     const messages = await prisma.message.findMany({
//       where: { friendshipId },
//       take: -50,
//       ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
//       orderBy: { sentAt: "asc" },
//     });

//     res.json(messages);
//   } catch (error) {
//     console.error("Error fetching messages:", error);
//     res.status(500).json({ error: "Failed to fetch messages" });
//   }
// });

// export default router;