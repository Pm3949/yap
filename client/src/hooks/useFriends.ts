import { useState, useEffect } from "react";
import { Socket } from "socket.io-client";
import { SERVER_URL } from "../lib/api"; // 🔥 Import kiya

export type Friend = {
  id: string;
  friendshipId: string;
  username?: string;
  firstName?: string;
  imageUrl?: string;
};

export const useFriends = (socket: Socket | null, user: any, isLoaded: boolean) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  // Fetch & Cache Friends
  useEffect(() => {
    if (isLoaded && socket && user?.id) {
      socket.emit("identify", user.id);
    }

    const cachedFriends = localStorage.getItem(`friends_${user?.id}`);
    if (cachedFriends) setFriends(JSON.parse(cachedFriends));

    const fetchFriends = async () => {
      if (!user?.id) return;
      try {
        // 🔥 Updated with SERVER_URL
        const res = await fetch(`${SERVER_URL}/api/friends/${user.id}`);
        const data = await res.json();
        setFriends(data);
        localStorage.setItem(`friends_${user.id}`, JSON.stringify(data));
      } catch (err) {
        console.error("Failed to fetch friends:", err);
      }
    };

    if (user?.id) fetchFriends();
  }, [socket, user?.id, isLoaded]);

  // Socket Listeners for Status
  useEffect(() => {
    if (!socket) return;

    const handleOnlineUsers = (users: string[]) => setOnlineUsers(new Set(users));
    const handleTyping = ({ senderId }: { senderId: string }) => setTypingUsers((prev) => new Set(prev).add(senderId));
    const handleStopTyping = ({ senderId }: { senderId: string }) => {
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(senderId);
        return newSet;
      });
    };

    socket.on("onlineUsersUpdate", handleOnlineUsers);
    socket.on("userTyping", handleTyping);
    socket.on("userStoppedTyping", handleStopTyping);

    return () => {
      socket.off("onlineUsersUpdate", handleOnlineUsers);
      socket.off("userTyping", handleTyping);
      socket.off("userStoppedTyping", handleStopTyping);
    };
  }, [socket]);

  return { friends, onlineUsers, typingUsers };
};