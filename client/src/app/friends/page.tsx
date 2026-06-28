"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/hooks/useSocket";
import { useRouter } from "next/navigation";
import { useFriends, Friend } from "@/hooks/useFriends";
import { useDirectChat } from "@/hooks/useFriendChat";
import { useDirectCall } from "@/hooks/useFriendCall";

import Sidebar from "@/components/friends/Sidebar";
import ChatWindow from "@/components/friends/ChatWindow";
import CallModals from "@/components/friends/CallModals";
import { Loader2 } from "lucide-react";

export default function FriendsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const socket = useSocket();

  // 🔥 FIX 1: Hydration Error rokne ke liye
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const [activeFriend, setActiveFriend] = useState<Friend | null>(null);

  // ── Hooks ──
  const { friends, onlineUsers, typingUsers } = useFriends(socket, user, !loading);
  const {
    chatHistories, unreadCounts, hasMoreMessages, newMessage, chatEndRef,
    handleInputChange, handleSendMessage, loadOlderMessages,
  } = useDirectChat(socket, user, activeFriend);
  
  const {
    callState, callData, localVideoRef, remoteVideoRef,
    isMicMuted, toggleMic, cancelCall,
    initiateCall, acceptCall, rejectCall, endCall,
  } = useDirectCall(socket, user, activeFriend);

  // ── Auth Protection ──
  useEffect(() => {
    if (isMounted && !loading && !user) router.push("/");
  }, [user, loading, router, isMounted]);

  // ── Global loading screen (Hydration Safe) ──
  if (!isMounted || loading) {
    return (
      <div className="h-screen bg-[#050507] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
        <p className="text-zinc-500 text-sm font-medium animate-pulse">Loading YAP Ecosystem…</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    // 🔥 FIX 2: Layout Fix (Viewport lock and flex structure)
    <div className="fixed inset-0 w-full h-[100dvh] flex bg-[#050507] text-white overflow-hidden font-sans">
      
      {/* Noise texture layer */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.025]"
           style={{ backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                    backgroundRepeat:"repeat", backgroundSize:"128px 128px" }} />

      {/* Call Modals (Poori screen ke upar aayenge) */}
      <CallModals
        callState={callState} callData={callData}
        isMicMuted={isMicMuted} toggleMic={toggleMic} cancelCall={cancelCall}
        acceptCall={acceptCall} rejectCall={rejectCall} endCall={endCall}
        localVideoRef={localVideoRef} remoteVideoRef={remoteVideoRef}
      />

      {/* ── SIDEBAR ── */}
      {/* Mobile logic: activeFriend hone par ye poora gayab ho jayega (hidden) */}
      <div className={`
        ${activeFriend ? "hidden md:flex" : "flex"} 
        w-full md:w-[320px] lg:w-[360px] h-full flex-shrink-0 z-20 border-r border-white/[0.06]
      `}>
        <Sidebar
          friends={friends}
          activeFriend={activeFriend}
          setActiveFriend={setActiveFriend}
          onlineUsers={onlineUsers}
          typingUsers={typingUsers}
          unreadCounts={unreadCounts}
        />
      </div>

      {/* ── CHAT WINDOW ── */}
      {/* Mobile logic: activeFriend NAHI hone par ye gayab ho jayega (hidden) */}
      <div className={`
        ${!activeFriend ? "hidden md:flex" : "flex"} 
        flex-1 h-full z-10 relative
      `}>
        <ChatWindow
          user={user}
          activeFriend={activeFriend}
          setActiveFriend={setActiveFriend}
          onlineUsers={onlineUsers}
          typingUsers={typingUsers}
          chatHistories={chatHistories}
          hasMoreMessages={hasMoreMessages}
          loadOlderMessages={loadOlderMessages}
          newMessage={newMessage}
          handleInputChange={handleInputChange}
          handleSendMessage={handleSendMessage}
          chatEndRef={chatEndRef}
          initiateCall={initiateCall}
        />
      </div>

    </div>
  );
}


  // "use client";

  // import { useState, useEffect } from "react";
  // import { useAuth } from "@/context/AuthContext";
  // import { useSocket } from "@/hooks/useSocket";
  // import { useRouter } from "next/navigation";
  // // Hooks
  // import { useFriends, Friend } from "@/hooks/useFriends";
  // import { useDirectChat } from "@/hooks/useFriendChat";
  // import { useDirectCall } from "@/hooks/useFriendCall";

  // // Components
  // import Sidebar from "@/components/friends/Sidebar";
  // import ChatWindow from "@/components/friends/ChatWindow";
  // import CallModals from "@/components/friends/CallModals";

  // export default function FriendsPage() {
  //   const { user, loading } = useAuth();
  //   const router = useRouter();
  //   const socket = useSocket();
    
  //   const [activeFriend, setActiveFriend] = useState<Friend | null>(null);

  //   // 1. Data & Status Hook
  //   const { friends, onlineUsers, typingUsers } = useFriends(socket, user, !loading);
    
  //   // 2. Messaging Hook
  //   const { 
  //     chatHistories, unreadCounts, hasMoreMessages, newMessage, chatEndRef, 
  //     handleInputChange, handleSendMessage, loadOlderMessages 
  //   } = useDirectChat(socket, user, activeFriend);

  //   // 3. WebRTC Calling Hook
  //   const { 
  //     callState, callData, localVideoRef, remoteVideoRef, 
  //     isMicMuted, toggleMic, cancelCall, 
  //     initiateCall, acceptCall, rejectCall, endCall 
  //   } = useDirectCall(socket, user, activeFriend);

  //   useEffect(() => {
  //   if (!loading && !user) {
  //     router.push("/");
  //   }
  // }, [user, loading, router]);


  // if (!user) return null;
  //   if (loading) {
  //     return (
  //       <div className="h-screen bg-black flex items-center justify-center text-white">
  //         <span className="animate-pulse">Loading Friends...</span>
  //       </div>
  //     );
  //   }

  //   return (
  //     <div className="flex h-screen bg-black text-white font-sans overflow-hidden relative">
        
  //       {/* 1. Modal Overlays (Only visible during calls) */}
  //       <CallModals 
  //         callState={callState} callData={callData} 
  //         isMicMuted={isMicMuted} toggleMic={toggleMic} cancelCall={cancelCall}
  //         acceptCall={acceptCall} rejectCall={rejectCall} endCall={endCall} 
  //         localVideoRef={localVideoRef} remoteVideoRef={remoteVideoRef} 
  //       />

  //       {/* 2. Left Panel: Friends List */}
  //       <Sidebar 
  //         friends={friends} activeFriend={activeFriend} setActiveFriend={setActiveFriend} 
  //         onlineUsers={onlineUsers} typingUsers={typingUsers} unreadCounts={unreadCounts} 
  //       />

  //       {/* 3. Right Panel: Active Chat */}
  //       <ChatWindow 
  //         user={user} activeFriend={activeFriend} setActiveFriend={setActiveFriend} 
  //         onlineUsers={onlineUsers} typingUsers={typingUsers} 
  //         chatHistories={chatHistories} hasMoreMessages={hasMoreMessages} loadOlderMessages={loadOlderMessages} 
  //         newMessage={newMessage} handleInputChange={handleInputChange} handleSendMessage={handleSendMessage} chatEndRef={chatEndRef} 
  //         initiateCall={initiateCall} 
  //       />
        
  //     </div>
  //   );
  // }
