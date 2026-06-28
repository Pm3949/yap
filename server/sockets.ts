// server/sockets.ts
import { Server, Socket } from "socket.io";
import { state, findSocketByUserId } from "./store.ts";
import { query } from "./lib/db.ts"; // Prisma ki jagah sirf query!

export const setupSockets = (io: Server) => {
  const broadcastOnlineUsers = () => {
    const onlineUserIds = Array.from(new Set(state.socketToUserId.values()));
    io.emit("onlineUsersUpdate", onlineUserIds);
  };

  io.on("connection", (socket: Socket) => {
    // --- 1. BASE EVENTS ---
    socket.on("identify", (userId: string) => {
      state.socketToUserId.set(socket.id, userId);
      console.log(`Socket ${socket.id} identified as user ${userId}`);
      broadcastOnlineUsers();
    });

    socket.on("disconnect", () => {
      state.socketToUserId.delete(socket.id);
      state.waitingQueue = state.waitingQueue.filter((id) => id !== socket.id);
      state.textWaitingQueue = state.textWaitingQueue.filter(
        (id) => id !== socket.id,
      );
      state.voiceWaitingQueue = state.voiceWaitingQueue.filter(
        (id) => id !== socket.id,
      );
      broadcastOnlineUsers();

      const roomId = state.userRooms.get(socket.id);
      if (roomId) {
        const roomState = state.activeRooms.get(roomId);
        if (roomState?.timer) clearInterval(roomState.timer);
        socket.to(roomId).emit("peerDisconnected");
        state.activeRooms.delete(roomId);
        state.userRooms.delete(socket.id);
      }
    });

    // --- 2. WEBRTC RELAYS (Used globally) ---
    socket.on("offer", (data) => socket.to(data.roomId).emit("offer", data));
    socket.on("answer", (data) => socket.to(data.roomId).emit("answer", data));
    socket.on("ice-candidate", (data) =>
      socket.to(data.roomId).emit("ice-candidate", data),
    );

    // --- 3. SUB-MODULES ---
    registerChaosMode(io, socket);
    registerFriendDMs(io, socket);
    registerDirectCalling(io, socket);
    registerMapMode(io, socket);
  });
};

// ==========================================
// SUB-MODULE: CHAOS MODE & MATCHMAKING
// ==========================================
const registerChaosMode = (io: Server, socket: Socket) => {
  // Video Queue
  socket.on("joinQueue", () => {
    if (!state.waitingQueue.includes(socket.id))
      state.waitingQueue.push(socket.id);
    if (state.waitingQueue.length >= 2) {
      const user1 = state.waitingQueue.shift()!;
      const user2 = state.waitingQueue.shift()!;
      const roomId = `room-${user1}-${user2}`;
      state.userRooms.set(user1, roomId);
      state.userRooms.set(user2, roomId);

      const s1 = io.sockets.sockets.get(user1);
      const s2 = io.sockets.sockets.get(user2);
      if (s1 && s2) {
        s1.join(roomId);
        s2.join(roomId);
        state.activeRooms.set(roomId, { timer: null, isActive: true });
        io.to(roomId).emit("matchFound", { roomId });
      }
    } else {
      socket.emit("waitingForMatch");
    }
  });

  // Text Queue
  socket.on("joinTextQueue", () => {
    if (!state.textWaitingQueue.includes(socket.id))
      state.textWaitingQueue.push(socket.id);
    if (state.textWaitingQueue.length >= 2) {
      const user1 = state.textWaitingQueue.shift()!;
      const user2 = state.textWaitingQueue.shift()!;
      const roomId = `text-room-${user1}-${user2}`;
      state.userRooms.set(user1, roomId);
      state.userRooms.set(user2, roomId);
      const s1 = io.sockets.sockets.get(user1);
      const s2 = io.sockets.sockets.get(user2);
      if (s1 && s2) {
        s1.join(roomId);
        s2.join(roomId);
        state.activeRooms.set(roomId, { timer: null, isActive: true });
        io.to(roomId).emit("textMatchFound", { roomId });
      }
    } else {
      socket.emit("waitingForTextMatch");
    }
  });

  // Voice Queue
  socket.on("joinVoiceQueue", () => {
    if (!state.voiceWaitingQueue.includes(socket.id))
      state.voiceWaitingQueue.push(socket.id);
    if (state.voiceWaitingQueue.length >= 2) {
      const user1 = state.voiceWaitingQueue.shift()!;
      const user2 = state.voiceWaitingQueue.shift()!;
      const roomId = `voice-room-${user1}-${user2}`;
      state.userRooms.set(user1, roomId);
      state.userRooms.set(user2, roomId);
      const s1 = io.sockets.sockets.get(user1);
      const s2 = io.sockets.sockets.get(user2);
      if (s1 && s2) {
        s1.join(roomId);
        s2.join(roomId);
        state.activeRooms.set(roomId, { timer: null, isActive: true });
        io.to(roomId).emit("voiceMatchFound", { roomId });
      }
    } else {
      socket.emit("waitingForVoiceMatch");
    }
  });

  // Skip Logic
  const handleSkip = (emitEvent: string) => {
    const roomId = state.userRooms.get(socket.id);
    if (roomId) {
      socket.to(roomId).emit(emitEvent);
      socket.leave(roomId);
      state.userRooms.delete(socket.id);
      const roomState = state.activeRooms.get(roomId);
      if (roomState?.timer) clearInterval(roomState.timer);
      state.activeRooms.delete(roomId);
    }
  };
  socket.on("skipTextMatch", () => handleSkip("strangerSkipped"));
  socket.on("skipVoiceMatch", () => handleSkip("strangerSkipped"));

  // In-Call Logic
  socket.on("sendStrangerMessage", ({ roomId, message }) =>
    socket.to(roomId).emit("receiveStrangerMessage", { message }),
  );
  socket.on("sendMessage", ({ roomId, message }) =>
    socket.to(roomId).emit("receiveMessage", { message }),
  );

  socket.on("startYap", (roomId) => {
    const roomState = state.activeRooms.get(roomId);
    if (roomState && roomState.isActive && !roomState.timer) {
      let timeLeft = 120;
      roomState.timer = setInterval(() => {
        timeLeft -= 1;
        io.to(roomId).emit("timerUpdate", { timeLeft });
        if (timeLeft <= 0) {
          clearInterval(roomState.timer);
          io.to(roomId).emit("timerEnded");
        }
      }, 1000);
    }
  });

  // Stranger Friend Requests (RAW SQL for Neon)
  socket.on("sendFriendRequest", async ({ roomId }) => {
    const clients = io.sockets.adapter.rooms.get(roomId);
    const receiverSocketId = Array.from(clients || []).find(
      (id) => id !== socket.id,
    );
    if (receiverSocketId) {
      const senderUserId = state.socketToUserId.get(socket.id);
      const receiverUserId = state.socketToUserId.get(receiverSocketId);
      if (senderUserId && receiverUserId) {
        const [uA, uB] = [senderUserId, receiverUserId].sort();
        try {
          const checkRes = await query(
            `SELECT id FROM "Friendship" WHERE "userAId" = $1 AND "userBId" = $2`,
            [uA, uB],
          );
          const existing = checkRes.rows[0];

          if (existing) {
            await query(
              `UPDATE "Friendship" SET level = 'LEVEL_1' WHERE id = $1`,
              [existing.id],
            );
            io.to(socket.id).emit("friendshipEstablished", {
              friendshipId: existing.id,
            });
            io.to(receiverSocketId).emit("friendshipEstablished", {
              friendshipId: existing.id,
            });
          } else {
            const createRes = await query(
              `INSERT INTO "Friendship" ("userAId", "userBId", "level") VALUES ($1, $2, 'LEVEL_1') RETURNING id`,
              [uA, uB],
            );
            const fId = createRes.rows[0].id;
            await query(
              `INSERT INTO "YapStory" ("friendshipId", "originTopic") VALUES ($1, 'Chaos')`,
              [fId],
            );
            io.to(receiverSocketId).emit("friendRequestReceived", {
              fromUserId: senderUserId,
              friendshipId: fId,
            });
            socket.emit("requestStatus", {
              success: true,
              message: "Request sent!",
            });
          }
        } catch (err) {
          console.error("Friend Request Error:", err);
          socket.emit("requestStatus", { success: false });
        }
      }
    }
  });

  socket.on("acceptFriendRequest", async ({ friendshipId }) => {
    try {
      const res = await query(
        `UPDATE "Friendship" SET level = 'LEVEL_1' WHERE id = $1 RETURNING "userAId", "userBId"`,
        [friendshipId],
      );
      const updated = res.rows[0];
      if (updated) {
        const sA = findSocketByUserId(updated.userAId);
        const sB = findSocketByUserId(updated.userBId);
        if (sA) io.to(sA).emit("friendshipEstablished", { friendshipId });
        if (sB) io.to(sB).emit("friendshipEstablished", { friendshipId });
      }
    } catch (err) {
      console.error(err);
    }
  });

  socket.on("rejectFriendRequest", ({ roomId }) =>
    socket.to(roomId).emit("friendRequestRejected"),
  );
};

// ==========================================
// SUB-MODULE: DIRECT MESSAGING (FRIENDS)
// ==========================================
const registerFriendDMs = (io: Server, socket: Socket) => {
  socket.on(
    "sendPrivateMessage",
    async ({ receiverId, friendshipId, content, tempId }) => {
      const senderId = state.socketToUserId.get(socket.id);
      if (!senderId) return;
      try {
        const res = await query(
          `INSERT INTO "Message" ("senderId", "friendshipId", "content", "status", "sentAt") VALUES ($1, $2, $3, 'SENT', NOW()) RETURNING *`,
          [senderId, friendshipId, content],
        );
        const savedMsg = res.rows[0];
        socket.emit("messageSaved", { tempId, savedMessage: savedMsg });

        const rSid = findSocketByUserId(receiverId);
        if (rSid) io.to(rSid).emit("receivePrivateMessage", savedMsg);
      } catch (err) {
        console.error(err);
      }
    },
  );

  socket.on("messageDelivered", async ({ messageId, senderId }) => {
    try {
      await query(`UPDATE "Message" SET status = 'DELIVERED' WHERE id = $1`, [
        messageId,
      ]);
      const sSid = findSocketByUserId(senderId);
      if (sSid)
        io.to(sSid).emit("messageStatusUpdate", {
          messageId,
          status: "DELIVERED",
        });
    } catch (err) {
      console.error(err);
    }
  });

  socket.on("messagesRead", async ({ friendshipId, readerId, senderId }) => {
    try {
      await query(
        `UPDATE "Message" SET status = 'READ' WHERE "friendshipId" = $1 AND "senderId" = $2 AND status != 'READ'`,
        [friendshipId, senderId],
      );
      const sSid = findSocketByUserId(senderId);
      if (sSid) io.to(sSid).emit("allMessagesRead", { friendshipId });
    } catch (err) {
      console.error(err);
    }
  });

  socket.on("typing", ({ receiverId }) => {
    const sId = state.socketToUserId.get(socket.id);
    const rSid = findSocketByUserId(receiverId);
    if (rSid && sId) io.to(rSid).emit("userTyping", { senderId: sId });
  });

  socket.on("stopTyping", ({ receiverId }) => {
    const sId = state.socketToUserId.get(socket.id);
    const rSid = findSocketByUserId(receiverId);
    if (rSid && sId) io.to(rSid).emit("userStoppedTyping", { senderId: sId });
  });
};

// ==========================================
// SUB-MODULE: DIRECT CALLING
// ==========================================
const registerDirectCalling = (io: Server, socket: Socket) => {
  socket.on("callFriend", ({ receiverId, callerName, type }) => {
    const callerId = state.socketToUserId.get(socket.id);
    const rSid = findSocketByUserId(receiverId);
    if (rSid && callerId) {
      const rId = `direct-${callerId}-${receiverId}-${Date.now()}`;
      socket.join(rId);
      io.to(rSid).emit("incomingCall", {
        callerId,
        callerName,
        type,
        roomId: rId,
      });
    } else {
      socket.emit("callFailed", { reason: "Friend is offline" });
    }
  });

  socket.on("acceptDirectCall", ({ roomId }) => {
    socket.join(roomId);
    socket.to(roomId).emit("callAccepted", { roomId });
  });

  socket.on("rejectDirectCall", ({ roomId }) =>
    socket.to(roomId).emit("callRejected"),
  );

  socket.on("endDirectCall", ({ roomId }) => {
    socket.leave(roomId);
    socket.to(roomId).emit("callEnded");
  });

  socket.on("cancelDirectCall", ({ receiverId }) => {
    const rSid = findSocketByUserId(receiverId);
    if (rSid) io.to(rSid).emit("callCancelled");
  });
};

// ==========================================
// SUB-MODULE: MAP CHAT (GEOSPATIAL)
// ==========================================

// Helper to generate dynamic alias
const generateAlias = () => {
  const adjs = ["Blue", "Neon", "Swift", "Quiet", "Urban", "Wild", "Deep", "Lost"];
  const nouns = ["Fox", "River", "Tiger", "Wanderer", "Echo", "Ghost", "Nomad", "Owl"];
  return `${adjs[Math.floor(Math.random() * adjs.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`;
};

const registerMapMode = (io: Server, socket: Socket) => {
  // 1. Drop a pin / create a room
  socket.on("createMapRoom", async ({ lat, lng, topic }) => {
    const userId = state.socketToUserId.get(socket.id) || socket.id;
    const roomId = `map-${userId}-${Date.now()}`;
    const alias = generateAlias();
    
    state.mapAliases.set(socket.id, alias);
    socket.join(roomId);
    state.userRooms.set(socket.id, roomId);
    
    try {
      await query(`
        INSERT INTO "MapCluster" (id, lat, lng, location, topic, "creatorId", type, "updatedAt") 
        VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($3, $2), 4326), $4, $5, 'room', NOW())
      `, [roomId, lat, lng, topic, socket.id]);
      
      socket.emit("roomCreated", { roomId, alias });
      socket.broadcast.emit("newMapUser", { id: roomId, lat, lng, topic, activeUsers: 1, type: 'room' });
    } catch (err) {
      console.error("Map create error:", err);
    }
  });

  // 2. Fetch clusters in viewport
  socket.on("fetchClusters", async ({ lat, lng, radius = 50000, topicFilter = "" }) => {
    try {
      let q = `
        SELECT id, lat, lng, "activeUsers", topic, type
        FROM "MapCluster"
        WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint($2, $1), 4326), $3)
          AND "updatedAt" > NOW() - INTERVAL '10 minutes'
          AND "isLocked" = FALSE
      `;
      const params: any[] = [lat, lng, radius];
      
      if (topicFilter.trim() !== "") {
        // If topicFilter is provided, we filter rooms by topic. 
        // We probably also want to exclude 'person' types if they are searching for a specific topic,
        // or just apply the ILIKE only on rooms.
        q += ` AND (type = 'person' OR topic ILIKE $4)`;
        params.push(`%${topicFilter.trim()}%`);
      }

      const res = await query(q, params);
      socket.emit("mapClustersUpdate", res.rows);
    } catch (err) {
      console.error("Fetch clusters error:", err);
    }
  });

  // 2.5 Broadcast Location as a Person (Wanderer)
  socket.on("broadcastLocation", async ({ lat, lng }) => {
    const userId = state.socketToUserId.get(socket.id) || socket.id;
    try {
      await query(`
        INSERT INTO "MapCluster" (id, lat, lng, location, type, "updatedAt") 
        VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($3, $2), 4326), 'person', NOW())
        ON CONFLICT (id) DO UPDATE SET 
          lat = EXCLUDED.lat, 
          lng = EXCLUDED.lng, 
          location = EXCLUDED.location,
          "updatedAt" = NOW()
      `, [userId, lat, lng]);
      
      socket.broadcast.emit("newMapUser", { id: userId, lat, lng, type: 'person' });
    } catch (err) {
      console.error("Broadcast location error:", err);
    }
  });

  socket.on("stopBroadcast", async () => {
    const userId = state.socketToUserId.get(socket.id) || socket.id;
    try {
      await query(`DELETE FROM "MapCluster" WHERE id = $1 AND type = 'person'`, [userId]);
      io.emit("removeMapUser", { id: userId });
    } catch (err) {
      console.error(err);
    }
  });

  // 3. Knock Feature
  socket.on("knockOnRoom", async ({ roomId }) => {
    try {
      const res = await query(`SELECT "creatorId" FROM "MapCluster" WHERE id = $1`, [roomId]);
      const creatorSocketId = res.rows[0]?.creatorId;
      if (creatorSocketId) {
        io.to(creatorSocketId).emit("receiveKnock", { knockerId: socket.id, roomId });
      } else {
        socket.emit("knockRejected", { reason: "Room not found or creator offline" });
      }
    } catch (err) {
      console.error(err);
    }
  });

  // 4. Knock Response
  socket.on("handleKnockResponse", async ({ knockerId, roomId, accepted }) => {
    if (accepted) {
      const knockerSocket = io.sockets.sockets.get(knockerId);
      if (knockerSocket) {
        const alias = generateAlias();
        state.mapAliases.set(knockerId, alias);
        knockerSocket.join(roomId);
        state.userRooms.set(knockerId, roomId);
        
        // Update DB count
        await query(`UPDATE "MapCluster" SET "activeUsers" = "activeUsers" + 1, "updatedAt" = NOW() WHERE id = $1`, [roomId]);
        
        // Notify
        io.to(roomId).emit("userJoinedMapRoom", { alias, message: `${alias} joined the campfire.` });
        knockerSocket.emit("knockAccepted", { roomId, alias });
        
        // Broadcast new count to map
        io.emit("updateClusterCount", { roomId, increment: 1 });
      }
    } else {
      io.to(knockerId).emit("knockRejected", { reason: "The vibe wasn't a match." });
    }
  });

  // 5. Send message in ephemeral room
  socket.on("sendMapMessage", ({ roomId, message }) => {
    const alias = state.mapAliases.get(socket.id) || "Anonymous";
    io.to(roomId).emit("receiveMapMessage", { sender: alias, message, timestamp: Date.now() });
    
    // Bump TTL
    query(`UPDATE "MapCluster" SET "updatedAt" = NOW() WHERE id = $1`, [roomId]).catch(console.error);
  });

  // 6. Leave room (One and done)
  const handleLeaveMapRoom = async (sId: string) => {
    const roomId = state.userRooms.get(sId);
    if (roomId && roomId.startsWith("map-")) {
      const alias = state.mapAliases.get(sId);
      io.to(roomId).emit("receiveMapMessage", { sender: "System", message: `${alias} left the campfire.`, timestamp: Date.now() });
      
      io.sockets.sockets.get(sId)?.leave(roomId);
      state.userRooms.delete(sId);
      state.mapAliases.delete(sId);
      
      try {
        const res = await query(`UPDATE "MapCluster" SET "activeUsers" = "activeUsers" - 1 WHERE id = $1 RETURNING "activeUsers"`, [roomId]);
        const count = res.rows[0]?.activeUsers;
        
        if (count <= 0) {
          await query(`DELETE FROM "MapCluster" WHERE id = $1`, [roomId]);
          io.emit("removeMapUser", { id: roomId }); // Tell map to remove pin
        } else {
          io.emit("updateClusterCount", { roomId, increment: -1 });
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  socket.on("leaveMapRoom", () => handleLeaveMapRoom(socket.id));
  socket.on("disconnect", () => handleLeaveMapRoom(socket.id));
};

// Start TTL Cron Job in background (runs every minute to clean rooms > 10 mins old)
setInterval(async () => {
  try {
    const res = await query(`DELETE FROM "MapCluster" WHERE "updatedAt" < NOW() - INTERVAL '10 minutes' RETURNING id`);
    res.rows.forEach(row => {
      // Broadcast to maps to remove dead pins
      // We don't have 'io' directly here, but we can assume it's global or just rely on next fetch
    });
  } catch (err) {
    // console.error("TTL Cron Error", err);
  }
}, 60 * 1000);
