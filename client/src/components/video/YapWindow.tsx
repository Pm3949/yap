"use client";

import { useState, useEffect, useRef } from "react";
import { useSocket } from "@/hooks/useSocket";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useRouter } from "next/navigation";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Loader2,
  MessageSquare,
  Send,
  X,
  UserPlus,
  Check,
  Zap,
  Sparkles,
  ChevronRight,
  Users
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function YapWindow() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const socket = useSocket();

  // ── Room & Matchmaking States ──
  const [roomId, setRoomId] = useState<string>("");
  const [isWaiting, setIsWaiting] = useState(false);
  const [canAddFriend, setCanAddFriend] = useState(false);

  // ── Friendship Flow States ──
  const [requestSent, setRequestSent] = useState(false);
  const [incomingRequest, setIncomingRequest] = useState<{
    fromUserId: string;
    friendshipId: string;
    senderSocketId?: string;
  } | null>(null);
  const [isFriend, setIsFriend] = useState(false);
  const [showFriendBanner, setShowFriendBanner] = useState(false);

  // ── Chat States ──
  const [messages, setMessages] = useState<{ sender: "me" | "them"; text: string }[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const isChatOpenRef = useRef(isChatOpen);

  // ── WebRTC Hook ──
  const {
    localVideoRef,
    remoteVideoRef,
    startCall,
    toggleMic,
    toggleCamera,
    isMicOn,
    isCameraOn,
  } = useWebRTC(socket, roomId || "");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  // Identify User to Server
  useEffect(() => {
    if (!loading && socket && user?.id) {
      socket.emit("identify", user.id);
    }
  }, [socket, user?.id, loading]);

  // Main Socket Listeners
  useEffect(() => {
    if (!socket) return;

    socket.on("waitingForMatch", () => setIsWaiting(true));

    socket.on("matchFound", ({ roomId }: { roomId: string }) => {
      setRoomId(roomId);
      setIsWaiting(false);
      setCanAddFriend(false);
      setIsFriend(false);
      setShowFriendBanner(false);
      setRequestSent(false);
      setIncomingRequest(null);
      setMessages([]);
      setIsChatOpen(false);
      setUnreadCount(0);
    });

    socket.on("timerEnded", () => setCanAddFriend(true));

    const handleReceiveMessage = ({ message }: { message: string }) => {
      setMessages((prev) => [...prev, { sender: "them", text: message }]);
      if (!isChatOpenRef.current) setUnreadCount((prev) => prev + 1);
    };
    socket.on("receiveMessage", handleReceiveMessage);

    socket.on("friendRequestReceived", (data) => setIncomingRequest(data));
    socket.on("friendRequestRejected", () => setRequestSent(false));
    socket.on("friendshipEstablished", () => {
      setIsFriend(true);
      setShowFriendBanner(true);
      setIncomingRequest(null);
      setRequestSent(false);
      setTimeout(() => setShowFriendBanner(false), 5000);
    });

    return () => {
      socket.off("waitingForMatch");
      socket.off("matchFound");
      socket.off("timerEnded");
      socket.off("friendRequestReceived");
      socket.off("friendRequestRejected");
      socket.off("friendshipEstablished");
      socket.off("receiveMessage", handleReceiveMessage);
    };
  }, [socket]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isChatOpen]);

  // Sync ref and clear notifications
  useEffect(() => {
    isChatOpenRef.current = isChatOpen;
    if (isChatOpen) setUnreadCount(0);
  }, [isChatOpen]);

  // Start call
  useEffect(() => {
    if (roomId) {
      startCall();
      socket?.emit("startYap", roomId);
    }
  }, [roomId, startCall, socket]);

  // Actions
  const joinQueue = () => socket?.emit("joinQueue");

  const handleSendRequest = () => {
    if (roomId && socket) {
      socket.emit("sendFriendRequest", { roomId });
      setRequestSent(true);
    }
  };

  const handleAcceptRequest = () => {
    if (incomingRequest && socket) {
      socket.emit("acceptFriendRequest", { friendshipId: incomingRequest.friendshipId });
    }
  };

  const handleRejectRequest = () => {
    if (incomingRequest && socket && roomId) {
      socket.emit("rejectFriendRequest", { roomId });
      setIncomingRequest(null);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !roomId) return;
    socket.emit("sendMessage", { roomId, message: newMessage });
    setMessages((prev) => [...prev, { sender: "me", text: newMessage }]);
    setNewMessage("");
  };

  if (loading)
    return (
      <div className="h-screen bg-[#050507] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  if (!user) return null;

  return (
    <div className="relative w-full h-screen bg-[#050507] overflow-hidden flex items-center justify-center font-sans">
      
      {/* ── Ambient Background Glows ── */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[150px]" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-violet-900/10 blur-[150px]" />
      </div>

      {/* ── Remote Video ── */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-10"
      />

      {/* ── Cinematic Vignette (Dark edges for better UI visibility) ── */}
      {roomId && (
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{ background: "radial-gradient(circle at center, transparent 40%, rgba(5,5,7,0.75) 100%)" }}
        />
      )}

      {/* ── Local Video PiP ── */}
      <div className={`absolute ${isChatOpen ? "bottom-32 md:bottom-28 right-80 md:right-[380px]" : "bottom-28 right-6"} w-28 h-40 md:w-36 md:h-52 z-20 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-2xl`}>
        <div className="absolute inset-0 rounded-[20px] bg-[#08080b] border border-white/10 overflow-hidden ring-1 ring-black/50">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${isCameraOn ? "opacity-100" : "opacity-0"}`}
          />
          {!isCameraOn && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
              <VideoOff className="text-white/20" size={28} />
            </div>
          )}
          <div className="absolute inset-0 rounded-[20px] ring-1 ring-inset ring-white/5 pointer-events-none" />
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          PRE-MATCH OVERLAY (Queue / Searching)
      ════════════════════════════════════════════════════════════════════ */}
      {!roomId && (
        <div className="absolute inset-0 bg-[#050507]/80 backdrop-blur-md flex flex-col items-center justify-center z-30">
          <div className="relative z-10 flex flex-col items-center gap-8 px-6">
            
            {/* Logo Mark */}
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-500 flex items-center justify-center shadow-[0_0_30px_-5px_rgba(124,58,237,0.5)]">
                <Zap size={24} className="text-white" fill="white" />
              </div>
              <span className="text-white font-black text-4xl tracking-tight">YAP</span>
            </div>

            {isWaiting ? (
              <div className="flex flex-col items-center gap-6 px-12 py-10 rounded-[32px] border border-white/10 bg-white/[0.03] backdrop-blur-2xl shadow-2xl animate-in zoom-in-95 duration-500">
                <div className="relative flex items-center justify-center w-20 h-20">
                  <div className="absolute inset-0 rounded-full border-2 border-violet-500/40 animate-ping" />
                  <div className="absolute inset-2 rounded-full border border-violet-500/20" />
                  <Loader2 className="w-10 h-10 text-violet-400 animate-spin" strokeWidth={2} />
                </div>
                <div className="flex flex-col items-center gap-2">
                  <p className="text-white font-bold text-xl tracking-tight">Connecting…</p>
                  <p className="text-white/40 text-sm font-medium flex items-center gap-1.5">
                    <Users size={15} /> Chaos Mode active
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6 px-10 py-10 rounded-[32px] border border-white/10 bg-white/[0.03] backdrop-blur-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-500">
                <div className="text-center">
                  <h2 className="text-white font-black text-3xl tracking-tight mb-2">Ready to Yap?</h2>
                  <p className="text-zinc-400 text-sm max-w-[240px] leading-relaxed mx-auto">
                    Get matched with a random person for a live video chat.
                  </p>
                </div>
                <button
                  onClick={joinQueue}
                  className="group relative flex items-center gap-2.5 px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-bold text-[15px] tracking-tight transition-all duration-200 active:scale-[0.97] shadow-[0_0_40px_-10px_rgba(124,58,237,0.5)]"
                >
                  <Sparkles size={18} className="opacity-90" />
                  Start Yapping
                  <ChevronRight size={18} className="opacity-50 group-hover:translate-x-1 transition-transform duration-200" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          FRIENDSHIP UI (Top-Center Banners)
      ════════════════════════════════════════════════════════════════════ */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-3 w-full max-w-sm px-4">
        
        {/* Established Banner */}
        {showFriendBanner && (
          <div className="relative flex items-center gap-3.5 px-5 py-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-600/15 backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <Check size={16} className="text-emerald-400" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-emerald-300 font-bold text-sm leading-none mb-1">Friends Added! 🎉</p>
              <p className="text-emerald-400/60 text-xs">You can now stay in touch</p>
            </div>
            <button onClick={() => setShowFriendBanner(false)} className="absolute top-3 right-3 text-white/30 hover:text-white transition-colors">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Incoming Request Card */}
        {incomingRequest && !isFriend && (
          <div className="w-full p-5 rounded-[24px] border border-white/10 bg-black/60 backdrop-blur-2xl shadow-2xl animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
                <UserPlus size={18} className="text-violet-400" />
              </div>
              <div>
                <p className="text-white font-bold text-[15px] leading-tight">Friend Request</p>
                <p className="text-zinc-400 text-xs mt-0.5">They want to connect with you</p>
              </div>
            </div>
            <div className="flex gap-2.5">
              <button onClick={handleRejectRequest} className="flex-1 py-2.5 rounded-xl border border-white/8 bg-white/5 hover:bg-red-500/15 hover:border-red-500/30 text-zinc-300 hover:text-red-300 font-semibold text-sm transition-all active:scale-[0.98]">
                Decline
              </button>
              <button onClick={handleAcceptRequest} className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm transition-all active:scale-[0.98] shadow-lg shadow-violet-600/30 flex items-center justify-center gap-1.5">
                <Check size={16} strokeWidth={2.5} /> Accept
              </button>
            </div>
          </div>
        )}

        {/* Send Request Button */}
        {canAddFriend && !isFriend && !incomingRequest && !showFriendBanner && (
          <button
            onClick={handleSendRequest}
            disabled={requestSent}
            className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 active:scale-[0.97] shadow-xl animate-in slide-in-from-top-4 ${
              requestSent
                ? "bg-white/5 border border-white/8 text-zinc-500 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 hover:shadow-emerald-500/40"
            }`}
          >
            {requestSent ? (
              <><Loader2 size={16} className="animate-spin opacity-60" /> Request Sent</>
            ) : (
              <><UserPlus size={16} /> Add Friend?</>
            )}
          </button>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          CONTROLS DOCK (Bottom-Center)
      ════════════════════════════════════════════════════════════════════ */}
      {roomId && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-4 py-3 rounded-[32px] border border-white/10 bg-black/50 backdrop-blur-2xl shadow-2xl">
          
          <button
            onClick={toggleMic}
            className={`flex items-center justify-center w-12 h-12 rounded-[20px] transition-all duration-200 active:scale-95 ${
              isMicOn ? "bg-white/10 hover:bg-white/15 text-white" : "bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400"
            }`}
          >
            {isMicOn ? <Mic size={20} strokeWidth={2} /> : <MicOff size={20} strokeWidth={2} />}
          </button>

          <button
            onClick={toggleCamera}
            className={`flex items-center justify-center w-12 h-12 rounded-[20px] transition-all duration-200 active:scale-95 ${
              isCameraOn ? "bg-white/10 hover:bg-white/15 text-white" : "bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400"
            }`}
          >
            {isCameraOn ? <VideoIcon size={20} strokeWidth={2} /> : <VideoOff size={20} strokeWidth={2} />}
          </button>

          <div className="w-px h-6 bg-white/10 mx-1" />

          <div className="relative">
            {unreadCount > 0 && !isChatOpen && (
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-violet-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-[0_0_15px_-3px_rgba(124,58,237,0.6)] whitespace-nowrap animate-in slide-in-from-bottom-2">
                <MessageSquare size={11} /> {unreadCount} New!
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-violet-600 rotate-45 rounded-[2px]" />
              </div>
            )}
            <button
              onClick={() => { setIsChatOpen(!isChatOpen); setUnreadCount(0); }}
              className={`relative flex items-center justify-center w-12 h-12 rounded-[20px] transition-all duration-200 active:scale-95 ${
                isChatOpen ? "bg-violet-600 text-white shadow-lg shadow-violet-600/40" : "bg-white/10 hover:bg-white/15 text-white"
              }`}
            >
              <MessageSquare size={20} strokeWidth={2} />
              {unreadCount > 0 && !isChatOpen && (
                <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-black" />
              )}
            </button>
          </div>

          <div className="w-px h-6 bg-white/10 mx-1" />

          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-1.5 px-5 h-12 rounded-[20px] bg-red-500/15 hover:bg-red-500/25 border border-red-500/20 hover:border-red-500/40 text-red-400 hover:text-red-300 font-bold text-sm transition-all duration-200 active:scale-95"
          >
            Skip <ChevronRight size={16} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          SLIDE-IN CHAT PANEL
      ════════════════════════════════════════════════════════════════════ */}
      {roomId && isChatOpen && (
        <div className="absolute top-0 right-0 w-full sm:w-80 md:w-[360px] h-full z-40 flex flex-col border-l border-white/10 bg-black/60 backdrop-blur-3xl animate-in slide-in-from-right duration-300 shadow-[-20px_0_40px_rgba(0,0,0,0.5)]">
          
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/20 flex items-center justify-center">
                <MessageSquare size={14} className="text-violet-400" />
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-none">Live Chat</p>
                <p className="text-zinc-500 text-[11px] mt-1">End-to-end encrypted</p>
              </div>
            </div>
            <button onClick={() => setIsChatOpen(false)} className="w-8 h-8 rounded-xl hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all">
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center gap-3 pt-16 text-center">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <MessageSquare size={20} className="text-zinc-600" />
                </div>
                <p className="text-zinc-500 text-sm font-medium">Say hi to kick things off 👋</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-1`}>
                  <div className={`max-w-[80%] px-4 py-2.5 text-[13.5px] font-medium leading-relaxed break-words shadow-sm ${
                    msg.sender === "me"
                      ? "bg-violet-600 text-white rounded-2xl rounded-tr-[6px]"
                      : "bg-white/[0.06] text-zinc-200 border border-white/[0.08] rounded-2xl rounded-tl-[6px]"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="px-4 pb-6 pt-3 border-t border-white/10 bg-black/40">
            <form onSubmit={handleSendMessage} className="group flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border border-white/10 bg-white/5 focus-within:border-violet-500/50 focus-within:bg-violet-600/5 transition-all duration-300">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Message…"
                className="flex-1 bg-transparent text-white text-sm placeholder:text-zinc-500 focus:outline-none min-w-0"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-[10px] bg-violet-600 hover:bg-violet-500 disabled:bg-white/5 disabled:text-zinc-600 text-white transition-all duration-200 active:scale-95 disabled:cursor-not-allowed"
              >
                <Send size={14} strokeWidth={2.5} className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}



// "use client";

// import { useState, useEffect, useRef } from "react";
// import { useSocket } from "@/hooks/useSocket";
// import { useWebRTC } from "@/hooks/useWebRTC";
// import {useRouter} from "next/navigation"
// import {
//   Mic,
//   MicOff,
//   Video as VideoIcon,
//   VideoOff,
//   Loader2,
//   MessageSquare,
//   Send,
//   X,
// } from "lucide-react";
// import { useAuth } from "@/context/AuthContext";

// export default function YapWindow() {
//   const { user, loading } = useAuth();
//   const router = useRouter();
//   const socket = useSocket();

//   // Room & Matchmaking States
//   const [roomId, setRoomId] = useState<string>("");
//   const [isWaiting, setIsWaiting] = useState(false);
//   const [canAddFriend, setCanAddFriend] = useState(false); // Locked by default

//   // Friendship Flow States
//   const [requestSent, setRequestSent] = useState(false);
//   const [incomingRequest, setIncomingRequest] = useState<{
//     fromUserId: string;
//     friendshipId: string;
//     senderSocketId?: string;
//   } | null>(null);
//   const [isFriend, setIsFriend] = useState(false);
//   const [showFriendBanner, setShowFriendBanner] = useState(false);

//   // Chat States
//   const [messages, setMessages] = useState<
//     { sender: "me" | "them"; text: string }[]
//   >([]);
//   const [newMessage, setNewMessage] = useState("");
//   const [isChatOpen, setIsChatOpen] = useState(false);
//   const [unreadCount, setUnreadCount] = useState(0);
//   const chatEndRef = useRef<HTMLDivElement>(null);
//   const isChatOpenRef = useRef(isChatOpen);

//   // Initialize WebRTC hook
//   const {
//     localVideoRef,
//     remoteVideoRef,
//     startCall,
//     toggleMic,
//     toggleCamera,
//     isMicOn,
//     isCameraOn,
//   } = useWebRTC(socket, roomId || "");
//   useEffect(() => {
//     if (!loading && !user) {
//       router.push("/");
//     }
//   }, [user, loading, router]);


//   // Identify User to Server
//   useEffect(() => {
//     if (!loading && socket && user?.id) {
//       socket.emit("identify", user.id);
//     }
//   }, [socket, user?.id]);

//   // Main Socket Listeners
//   useEffect(() => {
//     if (!socket) return;

//     socket.on("waitingForMatch", () => {
//       setIsWaiting(true);
//     });

//     socket.on("matchFound", ({ roomId }: { roomId: string }) => {
//       setRoomId(roomId);
//       setIsWaiting(false);

//       // Lock the add friend button until the hidden timer finishes
//       setCanAddFriend(false);

//       // Reset all states for the new person
//       setIsFriend(false);
//       setShowFriendBanner(false);
//       setRequestSent(false);
//       setIncomingRequest(null);
//       setMessages([]);
//       setIsChatOpen(false);
//       setUnreadCount(0);
//     });

//     // Internal timer listener to unlock the "Add Friend" button after 2 minutes (or when the timer ends on the server)
//     socket.on("timerEnded", () => {
//       setCanAddFriend(true); // Unlocks the "Add Friend" button
//     });

//     // Chat Listener
//     const handleReceiveMessage = ({ message }: { message: string }) => {
//       setMessages((prev) => [...prev, { sender: "them", text: message }]);
//       if (!isChatOpenRef.current) {
//         setUnreadCount((prev) => prev + 1);
//       }
//     };
//     socket.on("receiveMessage", handleReceiveMessage);

//     // Friend Listeners
//     socket.on("friendRequestReceived", (data) => {
//       setIncomingRequest(data);
//     });

//     socket.on("friendRequestRejected", () => {
//       setRequestSent(false); // Unlocks the sender's button if the other person rejected
//     });

//     socket.on("friendshipEstablished", () => {
//       setIsFriend(true);
//       setShowFriendBanner(true); // Show the banner
//       setIncomingRequest(null);
//       setRequestSent(false);

//       // Auto-hide the banner after 5 seconds
//       setTimeout(() => {
//         setShowFriendBanner(false);
//       }, 5000);
//     });

//     return () => {
//       socket.off("waitingForMatch");
//       socket.off("matchFound");
//       socket.off("friendRequestReceived");
//       socket.off("friendRequestRejected");
//       socket.off("friendshipEstablished");
//       socket.off("receiveMessage", handleReceiveMessage);
//     };
//   }, [socket]);

//   // Auto-scroll chat to latest message
//   useEffect(() => {
//     if (chatEndRef.current) {
//       chatEndRef.current.scrollIntoView({ behavior: "smooth" });
//     }
//   }, [messages, isChatOpen]);

//   // Keep the Ref in sync with the state, and clear notifications if open
//   useEffect(() => {
//     isChatOpenRef.current = isChatOpen;
//     if (isChatOpen) {
//       setUnreadCount(0);
//     }
//   }, [isChatOpen]);

//   // Start call when roomId is set
//   useEffect(() => {
//     if (roomId) {
//       startCall();
//       socket?.emit("startYap", roomId);
//     }
//   }, [roomId, startCall, socket]);

//   // Actions
//   const joinQueue = () => {
//     socket?.emit("joinQueue");
//   };

//   const handleSendRequest = () => {
//     if (roomId && socket) {
//       socket.emit("sendFriendRequest", { roomId });
//       setRequestSent(true);
//     }
//   };

//   const handleAcceptRequest = () => {
//     if (incomingRequest && socket) {
//       socket.emit("acceptFriendRequest", {
//         friendshipId: incomingRequest.friendshipId,
//       });
//     }
//   };

//   const handleRejectRequest = () => {
//     if (incomingRequest && socket && roomId) {
//       socket.emit("rejectFriendRequest", { roomId });
//       setIncomingRequest(null);
//     }
//   };

//   const handleSendMessage = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!newMessage.trim() || !socket || !roomId) return;

//     socket.emit("sendMessage", { roomId, message: newMessage });
//     setMessages((prev) => [...prev, { sender: "me", text: newMessage }]);
//     setNewMessage("");
//   };

//   if (loading)
//     return (
//       <div className="h-screen bg-black flex items-center justify-center">
//         <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
//       </div>
//     );
//   if (!user) return null;

//   return (
//     <div className="relative w-full h-screen bg-black overflow-hidden flex items-center justify-center">
//       {/* Remote Video */}
//       <video
//         ref={remoteVideoRef}
//         autoPlay
//         playsInline
//         className="absolute inset-0 w-full h-full object-cover"
//       />

//       {/* Local Video */}
//       <div className="absolute bottom-24 right-6 w-32 h-48 md:w-48 md:h-64 bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-white/10 z-10">
//         <video
//           ref={localVideoRef}
//           autoPlay
//           playsInline
//           muted
//           className="w-full h-full object-cover transform scale-x-[-1]"
//         />
//       </div>

//       {/* Pre-match Overlay */}
//       {!roomId && (
//         <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-20">
//           {isWaiting ? (
//             <div className="flex flex-col items-center gap-4 text-white">
//               <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
//               <p>Searching for a match in Chaos Mode...</p>
//             </div>
//           ) : (
//             <button
//               onClick={joinQueue}
//               className="px-8 py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-full font-semibold transition-all shadow-lg shadow-violet-600/30"
//             >
//               Start Yapping
//             </button>
//           )}
//         </div>
//       )}

//       {/* --- FRIENDSHIP UI SECTION --- */}
//       <div className="absolute top-24 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-3 w-full max-w-sm px-4">
//         {/* Established Friendship State */}
//         {showFriendBanner && (
//           <div className="flex items-center gap-3 bg-green-600 text-white pl-6 pr-10 py-3 rounded-full font-bold shadow-xl border-2 border-green-400 animate-in fade-in zoom-in duration-300 relative">
//             <span className="text-xl">🎉</span>
//             <span>Friends Established!</span>
//             <button
//               onClick={() => setShowFriendBanner(false)}
//               className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
//             >
//               <X size={18} />
//             </button>
//           </div>
//         )}

//         {/* Incoming Friend Request (NO BOUNCE, Dedicated Reject Button) */}
//         {incomingRequest && !isFriend && (
//           <div className="flex flex-col items-center gap-3 p-5 bg-violet-900/95 backdrop-blur-xl border border-violet-400/50 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 w-full">
//             <p className="text-white font-bold text-[15px]">
//               Wants to be your friend!
//             </p>

//             <div className="flex items-center gap-3 w-full mt-1">
//               <button
//                 onClick={handleRejectRequest}
//                 className="flex-1 py-2.5 bg-red-500/20 hover:bg-red-500 text-red-100 hover:text-white border border-red-500/50 hover:border-red-500 rounded-xl font-semibold transition-all"
//               >
//                 Reject
//               </button>
//               <button
//                 onClick={handleAcceptRequest}
//                 className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/30 rounded-xl font-bold transition-all"
//               >
//                 Accept
//               </button>
//             </div>
//           </div>
//         )}

//         {/* Send Friend Request Button */}
//         {canAddFriend && !isFriend && !incomingRequest && !showFriendBanner && (
//           <button
//             onClick={handleSendRequest}
//             disabled={requestSent}
//             className={`px-8 py-3 rounded-full font-bold transition-all shadow-lg ${
//               requestSent
//                 ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
//                 : "bg-green-600 hover:bg-green-700 text-white hover:scale-105 active:scale-95"
//             }`}
//           >
//             {requestSent ? "Request Sent..." : "Add Friend?"}
//           </button>
//         )}
//       </div>

//       {/* Controls Overlay */}
//       {roomId && (
//         <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full z-20">
//           <button
//             onClick={toggleMic}
//             className={`p-3 rounded-full transition-colors ${isMicOn ? "bg-white/20 hover:bg-white/30 text-white" : "bg-red-500/80 hover:bg-red-500 text-white"}`}
//           >
//             {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
//           </button>

//           <button
//             onClick={toggleCamera}
//             className={`p-3 rounded-full transition-colors ${isCameraOn ? "bg-white/20 hover:bg-white/30 text-white" : "bg-red-500/80 hover:bg-red-500 text-white"}`}
//           >
//             {isCameraOn ? <VideoIcon size={20} /> : <VideoOff size={20} />}
//           </button>

//           <div className="relative">
//             {unreadCount > 0 && !isChatOpen && (
//               <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg animate-in slide-in-from-bottom-2 whitespace-nowrap">
//                 {unreadCount} New Message{unreadCount > 1 ? "s" : ""}!
//                 <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-violet-600 rotate-45"></div>
//               </div>
//             )}
//             <button
//               onClick={() => {
//                 setIsChatOpen(!isChatOpen);
//                 setUnreadCount(0);
//               }}
//               className={`relative p-3 rounded-full transition-colors ${isChatOpen ? "bg-violet-600 text-white" : "bg-white/20 hover:bg-white/30 text-white"}`}
//             >
//               <MessageSquare size={20} />
//               {unreadCount > 0 && !isChatOpen && (
//                 <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-black rounded-full"></span>
//               )}
//             </button>
//           </div>

//           <button
//             onClick={() => window.location.reload()}
//             className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
//           >
//             Skip
//           </button>
//         </div>
//       )}

//       {/* Slide-in Chat Panel */}
//       {roomId && isChatOpen && (
//         <div className="absolute top-0 right-0 w-80 md:w-96 h-full bg-black/80 backdrop-blur-xl border-l border-white/10 flex flex-col z-40 animate-in slide-in-from-right duration-300">
//           <div className="flex items-center justify-between p-4 border-b border-white/10">
//             <h3 className="text-white font-bold flex items-center gap-2">
//               <MessageSquare size={18} className="text-violet-500" /> Live Chat
//             </h3>
//             <button
//               onClick={() => setIsChatOpen(false)}
//               className="text-gray-400 hover:text-white transition-colors"
//             >
//               <X size={20} />
//             </button>
//           </div>

//           <div className="flex-1 overflow-y-auto p-4 space-y-3">
//             {messages.length === 0 ? (
//               <p className="text-gray-500 text-center mt-10 text-sm">
//                 Say hi to start the conversation! 👋
//               </p>
//             ) : (
//               messages.map((msg, idx) => (
//                 <div
//                   key={idx}
//                   className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
//                 >
//                   <div
//                     className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${msg.sender === "me" ? "bg-violet-600 text-white rounded-tr-none" : "bg-gray-800 text-gray-200 rounded-tl-none border border-white/5"}`}
//                   >
//                     {msg.text}
//                   </div>
//                 </div>
//               ))
//             )}
//             <div ref={chatEndRef} />
//           </div>

//           <form
//             onSubmit={handleSendMessage}
//             className="p-4 border-t border-white/10 bg-black/50"
//           >
//             <div className="flex items-center gap-2">
//               <input
//                 type="text"
//                 value={newMessage}
//                 onChange={(e) => setNewMessage(e.target.value)}
//                 placeholder="Type a message..."
//                 className="flex-1 bg-gray-900 border border-white/10 rounded-full px-4 py-2 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors"
//               />
//               <button
//                 type="submit"
//                 disabled={!newMessage.trim()}
//                 className="p-2 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-full transition-colors"
//               >
//                 <Send size={18} />
//               </button>
//             </div>
//           </form>
//         </div>
//       )}
//     </div>
//   );
// }
