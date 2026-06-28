
// server/sockets.ts
import { Server, Socket } from "socket.io";
import { state, findSocketByUserId } from "./store.ts";
import { query } from "./lib/db.ts";

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

  // Stranger Friend Requests
  socket.on("sendFriendRequest", async ({ roomId }) => {
    const clients = io.sockets.adapter.rooms.get(roomId);
    const receiverSocketId = Array.from(clients || []).find(
      (id) => id !== socket.id,
    );
    if (receiverSocketId) {
      const senderUserId = state.socketToUserId.get(socket.id);
      const receiverUserId = state.socketToUserId.get(receiverSocketId);
      if (senderUserId && receiverUserId) {
        const [userAId, userBId] = [senderUserId, receiverUserId].sort();
        try {
          const existing = await prisma.friendship.findUnique({
            where: { userAId_userBId: { userAId, userBId } },
          });
          if (existing) {
            await prisma.friendship.update({
              where: { id: existing.id },
              data: { level: "LEVEL_1" },
            });
            io.to(socket.id).emit("friendshipEstablished", {
              friendshipId: existing.id,
            });
            io.to(receiverSocketId).emit("friendshipEstablished", {
              friendshipId: existing.id,
            });
          } else {
            const newFriendship = await prisma.friendship.create({
              data: {
                userAId,
                userBId,
                level: "LEVEL_1",
                yapStory: { create: { originTopic: "Chaos" } },
              },
            });
            io.to(receiverSocketId).emit("friendRequestReceived", {
              fromUserId: senderUserId,
              friendshipId: newFriendship.id,
            });
          }
        } catch (err) {
          console.error(err);
        }
      }
    }
  });

  socket.on("acceptFriendRequest", async ({ friendshipId }) => {
    try {
      const updated = await prisma.friendship.update({
        where: { id: friendshipId },
        data: { level: "LEVEL_1" },
      });
      const socketA = findSocketByUserId(updated.userAId);
      const socketB = findSocketByUserId(updated.userBId);
      if (socketA)
        io.to(socketA).emit("friendshipEstablished", { friendshipId });
      if (socketB)
        io.to(socketB).emit("friendshipEstablished", { friendshipId });
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
          `INSERT INTO "Message" ("senderId", "friendshipId", "content", "status", "sentAt")
       VALUES ($1, $2, $3, 'SENT', NOW()) RETURNING *`,
          [senderId, friendshipId, content],
        );

        const savedMsg = res.rows[0];
        socket.emit("messageSaved", { tempId, savedMessage: savedMsg });

        const receiverSocketId = findSocketByUserId(receiverId);
        if (receiverSocketId)
          io.to(receiverSocketId).emit("receivePrivateMessage", savedMsg);
      } catch (err) {
        console.error("SQL Error saving message:", err);
      }
    },
  );

  socket.on("messageDelivered", async ({ messageId, senderId }) => {
    try {
      await prisma.message.update({
        where: { id: messageId },
        data: { status: "DELIVERED" },
      });
      const originalSenderSocket = findSocketByUserId(senderId);
      if (originalSenderSocket)
        io.to(originalSenderSocket).emit("messageStatusUpdate", {
          messageId,
          status: "DELIVERED",
        });
    } catch (err) {
      console.error(err);
    }
  });

  socket.on("messagesRead", async ({ friendshipId, readerId, senderId }) => {
    try {
      await prisma.message.updateMany({
        where: { friendshipId, senderId, status: { not: "READ" } },
        data: { status: "READ" },
      });
      const originalSenderSocket = findSocketByUserId(senderId);
      if (originalSenderSocket)
        io.to(originalSenderSocket).emit("allMessagesRead", { friendshipId });
    } catch (err) {
      console.error(err);
    }
  });

  socket.on("typing", ({ receiverId }) => {
    const senderId = state.socketToUserId.get(socket.id);
    const receiverSocketId = findSocketByUserId(receiverId);
    if (receiverSocketId && senderId)
      io.to(receiverSocketId).emit("userTyping", { senderId });
  });

  socket.on("stopTyping", ({ receiverId }) => {
    const senderId = state.socketToUserId.get(socket.id);
    const receiverSocketId = findSocketByUserId(receiverId);
    if (receiverSocketId && senderId)
      io.to(receiverSocketId).emit("userStoppedTyping", { senderId });
  });
};

// ==========================================
// SUB-MODULE: DIRECT CALLING
// ==========================================
const registerDirectCalling = (io: Server, socket: Socket) => {
  socket.on("callFriend", ({ receiverId, callerName, type }) => {
    const callerId = state.socketToUserId.get(socket.id);
    const receiverSocketId = findSocketByUserId(receiverId);
    if (receiverSocketId && callerId) {
      const roomId = `direct-${callerId}-${receiverId}-${Date.now()}`;
      socket.join(roomId);
      io.to(receiverSocketId).emit("incomingCall", {
        callerId,
        callerName,
        type,
        roomId,
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
    const receiverSocketId = findSocketByUserId(receiverId);
    if (receiverSocketId) io.to(receiverSocketId).emit("callCancelled");
  });
};
