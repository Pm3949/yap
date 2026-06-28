// server/index.ts
import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
// @ts-ignore (Agar imports mein extension ka issue aaye toh)
import apiRoutes from "./api.ts"; 
// @ts-ignore
import { setupSockets } from "./sockets.ts";

const app = express();
const httpServer = createServer(app);

// 🔥 FIX 1: Sirf ek baar PORT define karo
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: [
    "https://yap-tau-nine.vercel.app", 
    "http://localhost:3000"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true 
}));

app.use(express.json());

// 1. Mount the REST API
app.use("/api", apiRoutes);

// Health check
app.get("/", (_req, res) => res.json({ status: "Server is healthy!" }));

// 2. Mount the Socket.IO server
// 🔥 FIX 2: 'server' ko 'httpServer' se replace kiya
const io = new Server(httpServer, {
  cors: {
    origin: [
      "https://yap-tau-nine.vercel.app", 
      "http://localhost:3000"
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

setupSockets(io);

// 3. Boot
// 🔥 FIX 3: Sirf ek listen call rakha hai
httpServer.listen(PORT, () => {
  console.log(`🚀 YAP Server running on port ${PORT}`);
});
// // server/index.ts
// import "dotenv/config"; // Load environment variables from .env file
// import express from "express";
// import cors from "cors";
// import { createServer } from "http";
// import { Server } from "socket.io";
// import { prisma } from "./lib/db";

// // 1. Setup Express and HTTP server
// const app = express();
// const httpServer = createServer(app);
// const PORT = Number(process.env.PORT || 3001);

// app.use(
//   cors({
//     origin: "http://localhost:3000",
//   }),
// );
// app.use(express.json());

// app.get("/api/friends/:userId", async (req, res) => {
//   try {
//     const { userId } = req.params;

//     const friendships = await prisma.friendship.findMany({
//       where: {
//         OR: [{ userAId: userId }, { userBId: userId }],
//         level: "LEVEL_1",
//       },
//       include: {
//         userA: true,
//         userB: true,
//       },
//     });

//     // Map through friendships, extract the friend, and INJECT the friendshipId
//     const friendsList = friendships.map((f) => {
//       const friendDetails = f.userAId === userId ? f.userB : f.userA;
//       return {
//         ...friendDetails,
//         friendshipId: f.id, // We need this to fetch messages later
//       };
//     });

//     res.json(friendsList);
//   } catch (error) {
//     console.error("Error fetching friends:", error);
//     res.status(500).json({ error: "Failed to fetch friends" });
//   }
// });

// app.get("/api/messages/:friendshipId", async (req, res) => {
//   try {
//     const { friendshipId } = req.params;
//     const cursor = req.query.cursor as string | undefined;

//     const messages = await prisma.message.findMany({
//       where: { friendshipId },
//       take: -50, // take last 50 records
//       ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
//       orderBy: { sentAt: "asc" }, //oldest to newwst
//     });

//     res.json(messages);
//   } catch (error) {
//     console.error("Error fetching messages:", error);
//     res.status(500).json({ error: "Failed to fetch messages" });
//   }
// });

// // 2. Configure Socket.IO with CORS settings
// const io = new Server(httpServer, {
//   cors: {
//     origin: "http://localhost:3000", // Frontend origin
//     methods: ["GET", "POST"],
//   },
// });

// // 3. In-memory waiting queues
// let waitingQueue: string[] = []; // For Video Chat
// let textWaitingQueue: string[] = []; // For Text Only Chat
// let voiceWaitingQueue: string[] = []; // For voice only
// const activeRooms = new Map();
// const userRooms = new Map<string, string>();
// const socketToUserId = new Map<string, string>();

// const broadcastOnlineUsers = () => {
//   // Get an array of all unique Clerk User IDs currently connected
//   const onlineUserIds = Array.from(new Set(socketToUserId.values()));
//   io.emit("onlineUsersUpdate", onlineUserIds); // Broadcast to EVERYONE
// };

// // 4. Connection Logic
// io.on("connection", (socket) => {
//   // Identify the user when they connect/login
//   socket.on("identify", (userId: string) => {
//     socketToUserId.set(socket.id, userId);
//     console.log(`Socket ${socket.id} identified as user ${userId}`);
//     broadcastOnlineUsers(); //Tell everyone someone new came online
//   });

//   // Matchmaking Logic: When a user joins the queue, add them to the waiting list and try to match them
//   socket.on("joinQueue", () => {
//     console.log(`User ${socket.id} joined the queue`);

//     // 1. Always add the current user to the queue first
//     if (!waitingQueue.includes(socket.id)) {
//       waitingQueue.push(socket.id);
//     }

//     // 2. Now check if we have enough users to form a pair
//     if (waitingQueue.length >= 2) {
//       const user1 = waitingQueue.shift()!;
//       const user2 = waitingQueue.shift()!;
//       const roomId = `room-${user1}-${user2}`;

//       console.log(`Matching users ${user1} and ${user2} into room ${roomId}`);

//       userRooms.set(user1, roomId);
//       userRooms.set(user2, roomId);

//       // Get the socket instances to join the room
//       const s1 = io.sockets.sockets.get(user1);
//       const s2 = io.sockets.sockets.get(user2);

//       if (s1 && s2) {
//         s1.join(roomId);
//         s2.join(roomId);

//         activeRooms.set(roomId, { timer: null, isActive: true });
//         // Notify both users of the match
//         io.to(roomId).emit("matchFound", { roomId });
//       }
//     } else {
//       // Notify user they are waiting for a match
//       socket.emit("waitingForMatch");
//     }
//   });

//   // --- TEXT ONLY MATCHMAKING ---
//   socket.on("joinTextQueue", () => {
//     console.log(`User ${socket.id} joined the TEXT queue`);

//     if (!textWaitingQueue.includes(socket.id)) {
//       textWaitingQueue.push(socket.id);
//     }

//     if (textWaitingQueue.length >= 2) {
//       const user1 = textWaitingQueue.shift()!;
//       const user2 = textWaitingQueue.shift()!;
//       const roomId = `text-room-${user1}-${user2}`;

//       console.log(`Matching text users ${user1} and ${user2} into ${roomId}`);

//       userRooms.set(user1, roomId);
//       userRooms.set(user2, roomId);

//       const s1 = io.sockets.sockets.get(user1);
//       const s2 = io.sockets.sockets.get(user2);

//       if (s1 && s2) {
//         s1.join(roomId);
//         s2.join(roomId);

//         activeRooms.set(roomId, { timer: null, isActive: true });
//         io.to(roomId).emit("textMatchFound", { roomId });
//       }
//     } else {
//       socket.emit("waitingForTextMatch");
//     }
//   });

//   socket.on("joinVoiceQueue", () => {
//     if (!voiceWaitingQueue.includes(socket.id)) {
//       voiceWaitingQueue.push(socket.id);
//     }

//     if (voiceWaitingQueue.length >= 2) {
//       const user1 = voiceWaitingQueue.shift()!;
//       const user2 = voiceWaitingQueue.shift()!;
//       const roomId = `voice-room-${user1}-${user2}`;

//       userRooms.set(user1, roomId);
//       userRooms.set(user2, roomId);

//       const s1 = io.sockets.sockets.get(user1);
//       const s2 = io.sockets.sockets.get(user2);

//       if (s1 && s2) {
//         s1.join(roomId);
//         s2.join(roomId);
//         activeRooms.set(roomId, { timer: null, isActive: true });
//         io.to(roomId).emit("voiceMatchFound", { roomId });
//       }
//     } else {
//       socket.emit("waitingForVoiceMatch");
//     }
//   });

//   // Relay ephemeral text messages between strangers
//   socket.on("sendStrangerMessage", ({ roomId, message }) => {
//     socket.to(roomId).emit("receiveStrangerMessage", { message });
//   });

//   // Handle skipping/leaving a text chat
//   socket.on("skipTextMatch", () => {
//     const roomId = userRooms.get(socket.id);
//     if (roomId) {
//       socket.to(roomId).emit("strangerSkipped");

//       // Ensure the skipping user actually leaves the socket.io room
//       socket.leave(roomId);
//       userRooms.delete(socket.id);

//       const roomState = activeRooms.get(roomId);
//       if (roomState?.timer) clearInterval(roomState.timer);
//       activeRooms.delete(roomId);
//     }
//   });

//   socket.on("skipVoiceMatch", () => {
//     const roomId = userRooms.get(socket.id);
//     if (roomId) {
//       // Tell the other person they were skipped
//       socket.to(roomId).emit("strangerSkipped");

//       // Clean up
//       socket.leave(roomId);
//       userRooms.delete(socket.id);

//       const roomState = activeRooms.get(roomId);
//       if (roomState?.timer) clearInterval(roomState.timer);
//       activeRooms.delete(roomId);
//     }
//   });

//   // WebRTC Signaling Logic (Relay offers, answers, and ICE candidates between matched users)
//   socket.on("offer", (data) => {
//     // Relay offer to the other user in the room
//     socket.to(data.roomId).emit("offer", data);
//   });

//   socket.on("answer", (data) => {
//     // Relay answer to the other user in the room
//     socket.to(data.roomId).emit("answer", data);
//   });

//   socket.on("ice-candidate", (data) => {
//     // Relay ICE candidate to the other user in the room
//     socket.to(data.roomId).emit("ice-candidate", data);
//   });

//   // 2-minute timer trigger
//   socket.on("startYap", (roomId) => {
//     const roomState = activeRooms.get(roomId);

//     // Check !roomState.timer to prevent multiple intervals if called twice
//     if (roomState && roomState.isActive && !roomState.timer) {
//       let timeLeft = 120; // 120 seconds = 2 minutes

//       roomState.timer = setInterval(() => {
//         timeLeft -= 1;
//         io.to(roomId).emit("timerUpdate", { timeLeft }); // Update client UI

//         if (timeLeft <= 0) {
//           clearInterval(roomState.timer);
//           io.to(roomId).emit("timerEnded"); // Unlocks 'Add Friend'
//         }
//       }, 1000); // 1-second ticks
//     }
//   });

//   // Handle the friend request logic here (e.g., when one user clicks 'Add Friend', emit an event to the other user, and handle the database update on the backend)
//   socket.on("sendFriendRequest", async ({ roomId }) => {
//     const senderSocketId = socket.id;

//     // 1. Find the other user in the room
//     const clients = io.sockets.adapter.rooms.get(roomId);
//     const receiverSocketId = Array.from(clients || []).find(
//       (id) => id !== senderSocketId,
//     );

//     if (receiverSocketId) {
//       const senderUserId = socketToUserId.get(senderSocketId);
//       const receiverUserId = socketToUserId.get(receiverSocketId);

//       if (senderUserId && receiverUserId) {
//         // Sort IDs for consistent DB lookup
//         const [userAId, userBId] = [senderUserId, receiverUserId].sort();

//         try {
//           // Check if a friendship already exists
//           const existingFriendship = await prisma.friendship.findUnique({
//             where: { userAId_userBId: { userAId, userBId } },
//           });

//           if (existingFriendship) {
//             // AUTOMATIC ACCEPTANCE: Both have now expressed interest
//             // (Or one is re-sending a request)
//             await prisma.friendship.update({
//               where: { id: existingFriendship.id },
//               data: { level: "LEVEL_1" }, // In your schema, LEVEL_1 is the starting point
//             });

//             // Notify both users they are now friends
//             io.to(senderSocketId).emit("friendshipEstablished", {
//               friendshipId: existingFriendship.id,
//             });
//             io.to(receiverSocketId).emit("friendshipEstablished", {
//               friendshipId: existingFriendship.id,
//             });

//             console.log(
//               `Mutual match! ${senderUserId} and ${receiverUserId} are now friends.`,
//             );
//           } else {
//             // FIRST REQUEST: Create the record
//             const newFriendship = await prisma.friendship.create({
//               data: {
//                 userAId,
//                 userBId,
//                 level: "LEVEL_1",
//                 yapStory: {
//                   create: { originTopic: "Chaos" },
//                 },
//               },
//             });

//             // NOTIFY RECEIVER: Show the "Accept" prompt
//             io.to(receiverSocketId).emit("friendRequestReceived", {
//               fromUserId: senderUserId,
//               friendshipId: newFriendship.id,
//             });

//             socket.emit("requestStatus", {
//               success: true,
//               message: "Request sent!",
//             });
//           }
//         } catch (err) {
//           console.error("Friendship error:", err);
//           socket.emit("requestStatus", { success: false });
//         }
//       }
//     }
//   });

//   // Handle explicit "Accept" click from the receiver
//   socket.on("acceptFriendRequest", async ({ friendshipId }) => {
//     try {
//       const updatedFriendship = await prisma.friendship.update({
//         where: { id: friendshipId },
//         data: { level: "LEVEL_1" },
//       });

//       // We need to find the socket IDs for both UserA and UserB
//       // This helper finds the first socket ID associated with a specific Clerk UserID
//       const findSocketByUserId = (userId: string) =>
//         Array.from(socketToUserId.entries()).find(
//           ([_, id]) => id === userId,
//         )?.[0];

//       const socketA = findSocketByUserId(updatedFriendship.userAId);
//       const socketB = findSocketByUserId(updatedFriendship.userBId);

//       if (socketA)
//         io.to(socketA).emit("friendshipEstablished", { friendshipId });
//       if (socketB)
//         io.to(socketB).emit("friendshipEstablished", { friendshipId });
//     } catch (err) {
//       console.error("Accept error:", err);
//     }
//   });

//   // Add this near your other friend request socket listeners
//   socket.on("rejectFriendRequest", ({ roomId }) => {
//     // Tell the other person in the room that their request was rejected/dismissed
//     socket.to(roomId).emit("friendRequestRejected");
//   });

//   socket.on("sendMessage", ({ roomId, message }) => {
//     // Relay the message to the other user in the room
//     if (roomId) {
//       socket.to(roomId).emit("receiveMessage", { message });
//     }
//   });

//   // 1. Sending the message
//   socket.on(
//     "sendPrivateMessage",
//     async ({ receiverId, friendshipId, content, tempId }) => {
//       const senderId = socketToUserId.get(socket.id);
//       if (!senderId) return;

//       try {
//         // Save it to the database immediately
//         const savedMsg = await prisma.message.create({
//           data: {
//             senderId,
//             friendshipId,
//             content,
//             status: "SENT", // Default status from your schema
//           },
//         });

//         // Acknowledge back to the SENDER so they can remove the loader (⏳ -> ✓)
//         socket.emit("messageSaved", { tempId, savedMessage: savedMsg });

//         // Find if receiver is online
//         const findSocketByUserId = (userId: string) =>
//           Array.from(socketToUserId.entries()).find(
//             ([_, id]) => id === userId,
//           )?.[0];
//         const receiverSocketId = findSocketByUserId(receiverId);

//         // If online, relay the actual saved message to them
//         if (receiverSocketId) {
//           io.to(receiverSocketId).emit("receivePrivateMessage", savedMsg);
//         }
//       } catch (dbError) {
//         console.error("Failed to save message:", dbError);
//       }
//     },
//   );
//   // 2. The Receiver's phone got the message
//   socket.on("messageDelivered", async ({ messageId, senderId }) => {
//     try {
//       await prisma.message.update({
//         where: { id: messageId },
//         data: { status: "DELIVERED" },
//       });

//       // Tell the sender to update their UI
//       const findSocketByUserId = (userId: string) =>
//         Array.from(socketToUserId.entries()).find(
//           ([_, id]) => id === userId,
//         )?.[0];
//       const originalSenderSocket = findSocketByUserId(senderId);

//       if (originalSenderSocket) {
//         io.to(originalSenderSocket).emit("messageStatusUpdate", {
//           messageId,
//           status: "DELIVERED",
//         });
//       }
//     } catch (err) {
//       console.error(err);
//     }
//   });

//   // 3. The Receiver opened the chat
//   socket.on("messagesRead", async ({ friendshipId, readerId, senderId }) => {
//     try {
//       // Update all unread messages in this chat to READ
//       await prisma.message.updateMany({
//         where: {
//           friendshipId,
//           senderId: senderId,
//           status: { not: "READ" },
//         },
//         data: { status: "READ" },
//       });

//       // Tell the sender to turn the ticks blue
//       const findSocketByUserId = (userId: string) =>
//         Array.from(socketToUserId.entries()).find(
//           ([_, id]) => id === userId,
//         )?.[0];
//       const originalSenderSocket = findSocketByUserId(senderId);

//       if (originalSenderSocket) {
//         io.to(originalSenderSocket).emit("allMessagesRead", { friendshipId });
//       }
//     } catch (err) {
//       console.error(err);
//     }
//   });

//   socket.on("typing", ({ receiverId }) => {
//     const senderId = socketToUserId.get(socket.id);
//     const findSocketByUserId = (userId: string) =>
//       Array.from(socketToUserId.entries()).find(
//         ([_, id]) => id === userId,
//       )?.[0];

//     const receiverSocketId = findSocketByUserId(receiverId);
//     if (receiverSocketId && senderId) {
//       io.to(receiverSocketId).emit("userTyping", { senderId });
//     }
//   });

//   socket.on("stopTyping", ({ receiverId }) => {
//     const senderId = socketToUserId.get(socket.id);
//     const findSocketByUserId = (userId: string) =>
//       Array.from(socketToUserId.entries()).find(
//         ([_, id]) => id === userId,
//       )?.[0];

//     const receiverSocketId = findSocketByUserId(receiverId);
//     if (receiverSocketId && senderId) {
//       io.to(receiverSocketId).emit("userStoppedTyping", { senderId });
//     }
//   });

//   // --- DIRECT FRIEND CALLING ---

//   // 1. Initiate the Call (Ringing)
//   socket.on("callFriend", ({ receiverId, callerName, type }) => {
//     const callerId = socketToUserId.get(socket.id);
//     const findSocketByUserId = (userId) =>
//       Array.from(socketToUserId.entries()).find(
//         ([_, id]) => id === userId,
//       )?.[0];

//     const receiverSocketId = findSocketByUserId(receiverId);

//     if (receiverSocketId && callerId) {
//       const roomId = `direct-${callerId}-${receiverId}-${Date.now()}`;
//       socket.join(roomId);
//       io.to(receiverSocketId).emit("incomingCall", {
//         callerId,
//         callerName,
//         type,
//         roomId,
//       });
//     } else {
//       socket.emit("callFailed", { reason: "Friend is offline" });
//     }
//   });

//   // 2. Accept the Call
//   socket.on("acceptDirectCall", ({ roomId }) => {
//     socket.join(roomId);
//     socket.to(roomId).emit("callAccepted", { roomId });
//   });

//   // 3. Reject the Call
//   socket.on("rejectDirectCall", ({ roomId }) => {
//     socket.to(roomId).emit("callRejected");
//   });

//   // 4. End an ACTIVE Call
//   socket.on("endDirectCall", ({ roomId }) => {
//     socket.leave(roomId);
//     socket.to(roomId).emit("callEnded");
//   });

//   // 5. Cancel a RINGING Call (The Fix!)
//   socket.on("cancelDirectCall", ({ receiverId }) => {
//     const findSocketByUserId = (userId) =>
//       Array.from(socketToUserId.entries()).find(
//         ([_, id]) => id === userId,
//       )?.[0];

//     const receiverSocketId = findSocketByUserId(receiverId);
//     if (receiverSocketId) {
//       io.to(receiverSocketId).emit("callCancelled"); // Tells their UI to close the incoming modal!
//     }
//   });

//   socket.on("disconnect", () => {
//     // Handle user disconnection:
//     // Remove from waiting queue if they were waiting
//     // Clean up any mappingsx`
//     socketToUserId.delete(socket.id);
//     waitingQueue = waitingQueue.filter((id) => id !== socket.id);
//     textWaitingQueue = textWaitingQueue.filter((id) => id !== socket.id);
//     voiceWaitingQueue = voiceWaitingQueue.filter((id) => id !== socket.id);
//     broadcastOnlineUsers();
//     // Handle active rooms if necessary (e.g., notify the other user, clean up room state)
//     const roomId = userRooms.get(socket.id);
//     if (roomId) {
//       const roomState = activeRooms.get(roomId);
//       if (roomState?.timer) {
//         clearInterval(roomState.timer);
//       }
//       socket.to(roomId).emit("peerDisconnected");
//       activeRooms.delete(roomId);
//       userRooms.delete(socket.id);
//     }
//   });
// });

// app.get("/", (_req, res) => {
//   res.json({ status: "ok" });
// });

// httpServer.listen(PORT, () => {
//   console.log(`Socket server running on http://localhost:${PORT}`);
// });
