// src/hooks/useStrangerVideoChat.ts
import { useEffect, useState, useRef } from "react";
import { Socket } from "socket.io-client";

export type MatchStatus = "idle" | "searching" | "matched";
export type ChatMessage = { sender: "me" | "them"; text: string };
export type FriendStatus = "none" | "sent" | "received" | "friends";

export const useStrangerVideoChat = (socket: Socket | null, user: any) => {
  const [status, setStatus] = useState<MatchStatus>("idle");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [timerEnded, setTimerEnded] = useState(false);

  const [friendStatus, setFriendStatus] = useState<FriendStatus>("none");
  const [incomingRequest, setIncomingRequest] = useState<any>(null);
  const [showFriendBanner, setShowFriendBanner] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  const isChatOpenRef = useRef(isChatOpen);

  useEffect(() => {
    isChatOpenRef.current = isChatOpen;
    if (isChatOpen) setUnreadCount(0);
  }, [isChatOpen]);

  useEffect(() => {
    if (!socket || !user?.id) return;
    socket.emit("identify", user.id);

    socket.on("waitingForMatch", () => setStatus("searching"));

    socket.on("matchFound", ({ roomId }) => {
      setRoomId(roomId);
      setStatus("matched");
      setTimerEnded(false);
      setFriendStatus("none");
      setIncomingRequest(null);
      setMessages([]);
      setIsChatOpen(false);
      setUnreadCount(0);
    });

    socket.on("timerEnded", () => setTimerEnded(true));

    const handleReceiveMessage = ({ message }: { message: string }) => {
      setMessages((prev) => [...prev, { sender: "them", text: message }]);
      if (!isChatOpenRef.current) setUnreadCount((prev) => prev + 1);
    };
    
    socket.on("receiveMessage", handleReceiveMessage);

    socket.on("friendRequestReceived", (data) => {
      setIncomingRequest(data);
      setFriendStatus("received");
    });

    socket.on("friendRequestRejected", () => {
      setFriendStatus("none");
    });

    socket.on("friendshipEstablished", () => {
      setFriendStatus("friends");
      setShowFriendBanner(true);
      setIncomingRequest(null);
      setTimeout(() => setShowFriendBanner(false), 5000);
    });

    // 🔥 THE FIX: Listen for when the stranger skips or leaves
    socket.on("peerDisconnected", () => {
      // Reloading ensures WebRTC tracks (Camera/Mic) are fully stopped
      // and sends the user perfectly back to the start page!
      window.location.reload();
    });

    // 🔥 Backup listener just in case they trigger an explicit skip
    socket.on("strangerSkipped", () => {
      window.location.reload();
    });

    return () => {
      socket.off("waitingForMatch");
      socket.off("matchFound");
      socket.off("timerEnded");
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("friendRequestReceived");
      socket.off("friendRequestRejected");
      socket.off("friendshipEstablished");
      socket.off("peerDisconnected"); // Cleanup
      socket.off("strangerSkipped");  // Cleanup
    };
  }, [socket, user?.id]);

  const findMatch = () => socket?.emit("joinQueue");

  const sendMessage = (text: string) => {
    if (!text.trim() || !socket || !roomId) return;
    socket.emit("sendMessage", { roomId, message: text });
    setMessages((prev) => [...prev, { sender: "me", text }]);
  };

  const sendFriendRequest = () => {
    if (socket && roomId) {
      socket.emit("sendFriendRequest", { roomId });
      setFriendStatus("sent");
    }
  };

  const acceptFriendRequest = () => {
    if (incomingRequest && socket) {
      socket.emit("acceptFriendRequest", { friendshipId: incomingRequest.friendshipId });
    }
  };

  const rejectFriendRequest = () => {
    if (incomingRequest && socket && roomId) {
      socket.emit("rejectFriendRequest", { roomId });
      setIncomingRequest(null);
      setFriendStatus("none");
    }
  };

  return {
    status,
    roomId,
    timerEnded,
    friendStatus,
    incomingRequest,
    showFriendBanner,
    setShowFriendBanner,
    messages,
    unreadCount,
    isChatOpen,
    setIsChatOpen,
    findMatch,
    sendMessage,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest
  };
};