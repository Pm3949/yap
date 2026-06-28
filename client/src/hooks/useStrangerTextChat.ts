// src/hooks/useStrangerTextChat.ts
import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";

export type StrangerMessage = {
  sender: "me" | "stranger";
  text: string;
};

export type MatchStatus = "idle" | "searching" | "matched";
export type FriendStatus = "none" | "sent" | "received" | "friends";

export const useStrangerTextChat = (socket: Socket | null, user: any) => {
  const [status, setStatus] = useState<MatchStatus>("idle");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [timerEnded, setTimerEnded] = useState(false);
  const [messages, setMessages] = useState<StrangerMessage[]>([]);
  const [friendStatus, setFriendStatus] = useState<FriendStatus>("none");
  const [friendshipId, setFriendshipId] = useState<string | null>(null);

  useEffect(() => {
    if (!socket || !user?.id) return;
    socket.emit("identify", user.id);

    socket.on("waitingForTextMatch", () => setStatus("searching"));

    socket.on("textMatchFound", ({ roomId }) => {
      setRoomId(roomId);
      setStatus("matched");
      setMessages([]);
      setTimerEnded(false);
      setFriendStatus("none");
      socket.emit("startYap", roomId);
    });

    socket.on("timerEnded", () => setTimerEnded(true));

    socket.on("receiveStrangerMessage", ({ message }) => {
      setMessages((prev) => [...prev, { sender: "stranger", text: message }]);
    });

    // 🔥 THE FIX: Smooth Skip & Disconnect Logic
    socket.on("strangerSkipped", () => {
      window.location.reload(); // Fresh start immediately
    });

    socket.on("peerDisconnected", () => {
      window.location.reload(); // Protects against closed tabs
    });

    // Friend Request Logic
    socket.on("friendRequestReceived", ({ friendshipId }) => {
      setFriendshipId(friendshipId);
      setFriendStatus("received");
    });

    socket.on("friendshipEstablished", () => {
      setFriendStatus("friends");
    });

    return () => {
      socket.off("waitingForTextMatch");
      socket.off("textMatchFound");
      socket.off("timerEnded");
      socket.off("receiveStrangerMessage");
      socket.off("strangerSkipped");
      socket.off("peerDisconnected");
      socket.off("friendRequestReceived");
      socket.off("friendshipEstablished");
    };
  }, [socket, user?.id]);

  const findMatch = () => {
    if (socket) socket.emit("joinTextQueue");
  };

  const handleNext = () => {
    if (socket) {
      socket.emit("skipTextMatch");
      window.location.reload(); // Instant reset for the person skipping
    }
  };

  const sendMessage = (text: string) => {
    if (!text.trim() || !socket || !roomId) return;
    socket.emit("sendStrangerMessage", { roomId, message: text });
    setMessages((prev) => [...prev, { sender: "me", text }]);
  };

  const sendFriendRequest = () => {
    if (socket && roomId) {
      socket.emit("sendFriendRequest", { roomId });
      setFriendStatus("sent");
    }
  };

  const acceptFriendRequest = () => {
    if (socket && friendshipId) {
      socket.emit("acceptFriendRequest", { friendshipId });
      setFriendStatus("friends");
    }
  };

  return {
    status,
    timerEnded,
    messages,
    friendStatus,
    findMatch,
    handleNext,
    sendMessage,
    sendFriendRequest,
    acceptFriendRequest,
  };
};