import { useState, useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import { Friend } from "./useFriends";
import { SERVER_URL } from "../lib/api"; // 🔥 Import kiya

export type Message = {
  id?: string;
  tempId?: string;
  senderId: string;
  content: string;
  sentAt: string | Date;
  status?: "PENDING" | "SENT" | "DELIVERED" | "READ";
};

export const useDirectChat = (socket: Socket | null, user: any, activeFriend: Friend | null) => {
  const [chatHistories, setChatHistories] = useState<Record<string, Message[]>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [hasMoreMessages, setHasMoreMessages] = useState<Record<string, boolean>>({});
  const [newMessage, setNewMessage] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fetchedChatsRef = useRef<Set<string>>(new Set());

  const activeFriendRef = useRef(activeFriend);
  const userRef = useRef(user?.id);

  useEffect(() => { activeFriendRef.current = activeFriend; }, [activeFriend]);
  useEffect(() => { userRef.current = user?.id; }, [user?.id]);

  // Fetch Chat History & Read Receipts
  useEffect(() => {
    const fetchChatHistory = async () => {
      if (!activeFriend) return;
      const fId = activeFriend.friendshipId;

      setUnreadCounts((prev) => ({ ...prev, [fId]: 0 }));

      if (!chatHistories[fId]) {
        const cachedChat = localStorage.getItem(`chat_${fId}`);
        if (cachedChat) setChatHistories((prev) => ({ ...prev, [fId]: JSON.parse(cachedChat) }));
      }

      if (fetchedChatsRef.current.has(fId)) return;

      try {
        // 🔥 Updated with SERVER_URL
        const res = await fetch(`${SERVER_URL}/api/messages/${fId}`);
        const history = await res.json();

        setChatHistories((prev) => {
          const liveMessages = prev[fId] || [];
          const historyIds = new Set(history.map((m: any) => m.id));
          const newLiveMessages = liveMessages.filter((m) => m.id ? !historyIds.has(m.id) : true);
          const finalHistory = [...history, ...newLiveMessages];
          localStorage.setItem(`chat_${fId}`, JSON.stringify(finalHistory));
          return { ...prev, [fId]: finalHistory };
        });

        setHasMoreMessages((prev) => ({ ...prev, [fId]: history.length === 50 }));
        fetchedChatsRef.current.add(fId);
      } catch (err) { console.error(err); }
    };
    fetchChatHistory();
  }, [activeFriend]);

  useEffect(() => {
    if (!activeFriend || !socket || !user?.id) return;
    socket.emit("messagesRead", {
      friendshipId: activeFriend.friendshipId,
      readerId: user.id,
      senderId: activeFriend.id,
    });
  }, [activeFriend, socket, user?.id]);

  // Message Socket Listeners
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (msg: any) => {
      setChatHistories((prev) => ({ ...prev, [msg.friendshipId]: [...(prev[msg.friendshipId] || []), msg] }));
      if (activeFriendRef.current?.friendshipId === msg.friendshipId) {
        socket.emit("messagesRead", { friendshipId: msg.friendshipId, readerId: userRef.current, senderId: msg.senderId });
      } else {
        socket.emit("messageDelivered", { messageId: msg.id, senderId: msg.senderId });
        setUnreadCounts((prev) => ({ ...prev, [msg.friendshipId]: (prev[msg.friendshipId] || 0) + 1 }));
      }
    };

    const handleMessageSaved = ({ tempId, savedMessage }: any) => {
      setChatHistories((prev) => {
        const history = prev[savedMessage.friendshipId] || [];
        return {
          ...prev,
          [savedMessage.friendshipId]: history.map((m) => {
            if (m.tempId === tempId) {
              const finalStatus = m.status === "READ" || m.status === "DELIVERED" ? m.status : savedMessage.status;
              return { ...savedMessage, status: finalStatus, tempId: m.tempId };
            }
            return m;
          }),
        };
      });
    };

    const handleStatusUpdate = ({ messageId, status }: any) => {
      setChatHistories((prev) => {
        const newHistories = { ...prev };
        for (const fId in newHistories) {
          newHistories[fId] = newHistories[fId].map((m) => m.id === messageId ? { ...m, status: status as any } : m);
        }
        return newHistories;
      });
    };

    const handleAllRead = ({ friendshipId }: any) => {
      setChatHistories((prev) => {
        const history = prev[friendshipId] || [];
        return {
          ...prev,
          [friendshipId]: history.map((m) => m.senderId === userRef.current ? { ...m, status: "READ" } : m),
        };
      });
    };

    socket.on("receivePrivateMessage", handleReceiveMessage);
    socket.on("messageSaved", handleMessageSaved);
    socket.on("messageStatusUpdate", handleStatusUpdate);
    socket.on("allMessagesRead", handleAllRead);

    return () => {
      socket.off("receivePrivateMessage", handleReceiveMessage);
      socket.off("messageSaved", handleMessageSaved);
      socket.off("messageStatusUpdate", handleStatusUpdate);
      socket.off("allMessagesRead", handleAllRead);
    };
  }, [socket]);

  // Actions
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (socket && activeFriend) {
      socket.emit("typing", { receiverId: activeFriend.id });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stopTyping", { receiverId: activeFriend.id });
      }, 2000);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !activeFriend || !user?.id) return;

    const fId = activeFriend.friendshipId;
    const tempId = `temp-${Date.now()}`;

    socket.emit("sendPrivateMessage", { receiverId: activeFriend.id, friendshipId: fId, content: newMessage, tempId });
    socket.emit("stopTyping", { receiverId: activeFriend.id });

    setChatHistories((prev) => ({
      ...prev,
      [fId]: [...(prev[fId] || []), { tempId, senderId: user.id, content: newMessage, sentAt: new Date(), status: "PENDING" }],
    }));
    setNewMessage("");
  };

  const loadOlderMessages = async () => {
    if (!activeFriend) return;
    const fId = activeFriend.friendshipId;
    const currentMsgs = chatHistories[fId] || [];
    if (currentMsgs.length === 0) return;

    try {
      // 🔥 Updated with SERVER_URL
      const res = await fetch(`${SERVER_URL}/api/messages/${fId}?cursor=${currentMsgs[0].id}`);
      const olderMessages = await res.json();

      if (olderMessages.length < 50) setHasMoreMessages((prev) => ({ ...prev, [fId]: false }));

      setChatHistories((prev) => {
        const newHistory = [...olderMessages, ...prev[fId]];
        localStorage.setItem(`chat_${fId}`, JSON.stringify(newHistory));
        return { ...prev, [fId]: newHistory };
      });
    } catch (err) { console.error(err); }
  };

  return {
    chatHistories,
    unreadCounts,
    hasMoreMessages,
    newMessage,
    chatEndRef,
    handleInputChange,
    handleSendMessage,
    loadOlderMessages
  };
};