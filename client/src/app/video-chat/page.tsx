"use client";

import { useEffect, useRef, useState } from "react";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/context/AuthContext";
import { useStrangerVideoChat } from "@/hooks/useStrangerVideoChat";
import { useWebRTC } from "@/hooks/useWebRTC";
import Image from "next/image";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Loader2,
  MessageSquare,
  Send,
  X,
  ArrowLeft,
  UserPlus,
  Check,
  Sparkles,
  ChevronRight,
  Radio,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function YapPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const socket = useSocket();

  // 🔥 FIX: Hydration error rokne ke liye isMounted state
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [currentText, setCurrentText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 1. Hook for Matchmaking & Chat logic
  const {
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
    rejectFriendRequest,
  } = useStrangerVideoChat(socket, user);

  // 2. Hook for Camera & WebRTC logic
  const {
    localVideoRef,
    remoteVideoRef,
    startCall,
    toggleMic,
    toggleCamera,
    isMicOn,
    isCameraOn,
  } = useWebRTC(socket, roomId || "");

  // ── Auth Guard ──
  useEffect(() => {
    // 🔥 isMounted check add kiya hai yahan
    if (isMounted && !loading && !user) {
      router.push("/");
    }
  }, [user, loading, router, isMounted]);

  // ── Start call when matched ──
  useEffect(() => {
    if (roomId) {
      startCall();
      socket?.emit("startYap", roomId);
    }
  }, [roomId, startCall, socket]);

  // ── Auto-scroll chat ──
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, isChatOpen]);

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentText.trim()) return;
    sendMessage(currentText);
    setCurrentText("");
  };

  /* ── GLOBAL LOADING SCREEN (Hydration Safe) ── */
  // 🔥 FIX: Agar mount nahi hua hai toh bhi server ko yahi loading screen dikhani hai
  if (!isMounted || loading)
    return (
      <div className="h-screen flex items-center justify-center bg-[#050507]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[140px]" />
        </div>
        <div className="relative flex flex-col items-center gap-5 px-10 py-8 rounded-[28px] border border-white/8 bg-white/[0.02] backdrop-blur-xl shadow-2xl">
          <div className="relative flex items-center justify-center w-12 h-12">
            <div className="absolute inset-0 rounded-full border border-violet-600/30 animate-ping" />
            <Loader2 className="w-7 h-7 text-violet-400 animate-spin" strokeWidth={2} />
          </div>
          <p className="text-white/40 text-sm font-medium tracking-wide">Loading…</p>
        </div>
      </div>
    );

  if (!user) return null;

return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden flex flex-col bg-[#050507] font-sans">
      
      {/* ── Ambient Background Glows ── */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-violet-600/8 blur-[160px]" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-violet-900/8 blur-[130px]" />
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          HEADER (Top par locked rahega)
      ══════════════════════════════════════════════════════════════════════ */}
      <header className="relative z-40 flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-white/[0.06] bg-[#050507]/60 backdrop-blur-2xl pt-safe">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center justify-center w-10 h-10 rounded-xl border border-white/8 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all duration-200 active:scale-95"
          >
            <ArrowLeft size={18} strokeWidth={2} />
          </Link>
          <Link href="/" className="flex items-center gap-3">
            <Image 
              src="/yap-logo-wordmark.png" 
              alt="YAP Logo" 
              width={100} 
              height={32} 
              className="h-7 sm:h-8 w-auto mix-blend-screen drop-shadow-[0_0_15px_rgba(192,38,211,0.4)]" 
              priority 
            />
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-white/10 bg-white/5">
              <VideoIcon size={12} className="text-violet-400" />
              <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
                Video
              </span>
            </div>
          </Link>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════════
          VIDEO AREA (Bachi hui space cover karega)
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="relative flex-1 z-10 overflow-hidden bg-black/20">
        
        {/* Remote Video */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Cinematic Vignette */}
        {status === "matched" && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at center, transparent 30%, rgba(5,5,7,0.85) 100%)",
            }}
          />
        )}

        {/* Local Video (PiP) */}
        <div
          className={`absolute transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] z-20 ${
            isChatOpen && status === "matched"
              ? "bottom-28 right-80 md:right-[400px]"
              : "bottom-28 right-6"
          } w-32 h-44 md:w-40 md:h-56`}
        >
          <div className="relative w-full h-full rounded-[24px] border border-white/10 bg-zinc-900/80 backdrop-blur-md overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${isCameraOn ? "opacity-100" : "opacity-0"}`}
            />
            <div className="absolute inset-0 rounded-[24px] ring-1 ring-inset ring-white/5 pointer-events-none" />
            {!isCameraOn && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-md">
                <VideoOff className="text-white/30" size={24} />
              </div>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            PRE-MATCH OVERLAYS (Andar shift kar diya)
        ══════════════════════════════════════════════════════════════════════ */}
        {(status === "idle" || status === "searching") && (
          <div className="absolute inset-0 bg-[#050507]/80 backdrop-blur-xl flex flex-col items-center justify-center z-30">
            {status === "searching" ? (
              <div className="flex flex-col items-center gap-8 animate-in fade-in zoom-in-95 duration-500">
                <div className="relative flex items-center justify-center w-28 h-28">
                  <div className="absolute inset-[-20px] rounded-full border border-violet-500/10 animate-[ping_3s_ease-in-out_infinite]" />
                  <div className="absolute inset-0 rounded-full border border-violet-500/20 animate-[ping_2.2s_ease-in-out_infinite_0.4s]" />
                  <div className="absolute inset-4 rounded-full border border-violet-500/30 animate-[ping_1.5s_ease-in-out_infinite_0.8s]" />
                  <div className="relative w-16 h-16 rounded-[20px] border border-violet-500/40 bg-violet-600/20 flex items-center justify-center backdrop-blur-md shadow-[0_0_30px_rgba(124,58,237,0.3)]">
                    <Loader2 className="w-8 h-8 text-violet-400 animate-spin" strokeWidth={2.5} />
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2 text-center">
                  <h2 className="text-2xl font-black tracking-tight text-white">Finding your match…</h2>
                  <p className="text-violet-400/60 text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                    <Radio size={14} className="text-violet-500 animate-pulse" /> Scanning
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6 px-6 max-w-lg text-center animate-in fade-in slide-in-from-bottom-8 duration-500">
                <div className="w-24 h-24 bg-violet-600/10 border border-violet-500/20 rounded-[32px] flex items-center justify-center mb-2 shadow-[0_0_50px_rgba(124,58,237,0.15)]">
                  <VideoIcon size={44} className="text-violet-400" strokeWidth={1.5} />
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none">
                  Video Chaos
                </h2>
                <p className="text-zinc-400 text-base md:text-lg leading-relaxed mb-4">
                  Face-to-face connections. You have exactly <strong className="text-white">2 minutes</strong> to pass the vibe check.
                </p>
                <button
                  onClick={findMatch}
                  className="group relative flex items-center gap-3 px-10 py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-bold text-[16px] tracking-tight transition-all duration-200 active:scale-[0.97] shadow-[0_0_40px_-10px_rgba(124,58,237,0.5)]"
                >
                  <Sparkles size={18} className="opacity-90" />
                  Start Yapping
                  <ChevronRight size={18} className="opacity-50 group-hover:translate-x-1 transition-transform duration-200" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            FRIENDSHIP UI (Top-Center over video)
        ══════════════════════════════════════════════════════════════════════ */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-3 w-full max-w-sm px-4">
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

          {incomingRequest && friendStatus !== "friends" && (
            <div className="w-full p-5 rounded-[24px] border border-white/10 bg-black/70 backdrop-blur-2xl shadow-2xl animate-in slide-in-from-top-4 duration-300">
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
                <button onClick={rejectFriendRequest} className="flex-1 py-2.5 rounded-xl border border-white/8 bg-white/5 hover:bg-red-500/15 text-zinc-300 hover:text-red-300 font-semibold text-sm transition-all active:scale-[0.98]">
                  Decline
                </button>
                <button onClick={acceptFriendRequest} className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm transition-all active:scale-[0.98] shadow-lg shadow-violet-600/30 flex items-center justify-center gap-1.5">
                  <Check size={16} strokeWidth={2.5} /> Accept
                </button>
              </div>
            </div>
          )}

          {timerEnded && friendStatus !== "friends" && !incomingRequest && !showFriendBanner && (
            <button
              onClick={sendFriendRequest}
              disabled={friendStatus === "sent"}
              className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 active:scale-[0.97] shadow-xl animate-in slide-in-from-top-4 ${
                friendStatus === "sent"
                  ? "bg-white/5 border border-white/8 text-zinc-500 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)]"
              }`}
            >
              {friendStatus === "sent" ? (
                <><Loader2 size={16} className="animate-spin opacity-60" /> Request Sent</>
              ) : (
                <><UserPlus size={16} /> Add Friend?</>
              )}
            </button>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            CONTROLS DOCK (Bottom-Center)
        ══════════════════════════════════════════════════════════════════════ */}
        {status === "matched" && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-4 py-3 rounded-[32px] border border-white/10 bg-black/60 backdrop-blur-2xl shadow-2xl">
            <button
              onClick={toggleMic}
              className={`flex items-center justify-center w-12 h-12 rounded-[20px] transition-all duration-200 active:scale-95 ${
                isMicOn ? "bg-white/10 hover:bg-white/20 text-white" : "bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400"
              }`}
            >
              {isMicOn ? <Mic size={20} strokeWidth={2} /> : <MicOff size={20} strokeWidth={2} />}
            </button>

            <button
              onClick={toggleCamera}
              className={`flex items-center justify-center w-12 h-12 rounded-[20px] transition-all duration-200 active:scale-95 ${
                isCameraOn ? "bg-white/10 hover:bg-white/20 text-white" : "bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400"
              }`}
            >
              {isCameraOn ? <VideoIcon size={20} strokeWidth={2} /> : <VideoOff size={20} strokeWidth={2} />}
            </button>

            <div className="w-px h-6 bg-white/10 mx-1" />

            <div className="relative">
              {unreadCount > 0 && !isChatOpen && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-violet-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-[0_0_15px_-3px_rgba(124,58,237,0.6)] whitespace-nowrap animate-in slide-in-from-bottom-2">
                  <MessageSquare size={11} /> {unreadCount} New
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-violet-600 rotate-45 rounded-[2px]" />
                </div>
              )}
              <button
                onClick={() => setIsChatOpen(!isChatOpen)}
                className={`relative flex items-center justify-center w-12 h-12 rounded-[20px] transition-all duration-200 active:scale-95 ${
                  isChatOpen ? "bg-violet-600 text-white shadow-[0_0_20px_rgba(124,58,237,0.4)]" : "bg-white/10 hover:bg-white/20 text-white"
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
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SLIDE-IN CHAT PANEL (Right Drawer style)
      ══════════════════════════════════════════════════════════════════════ */}
      {status === "matched" && isChatOpen && (
        <div className="absolute top-0 right-0 w-full sm:w-80 md:w-[380px] h-full z-50 flex flex-col border-l border-white/10 bg-black/75 backdrop-blur-3xl animate-in slide-in-from-right duration-300 shadow-[-20px_0_50px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 mt-safe">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[10px] bg-violet-600/20 border border-violet-500/20 flex items-center justify-center">
                <MessageSquare size={16} className="text-violet-400" />
              </div>
              <div>
                <p className="text-white font-bold text-[15px] leading-none">Live Chat</p>
                <p className="text-zinc-500 text-[11px] mt-1 font-medium">Messages disappear after call</p>
              </div>
            </div>
            <button
              onClick={() => setIsChatOpen(false)}
              className="w-8 h-8 rounded-xl hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center gap-3 pt-16 text-center">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
                  <MessageSquare size={20} className="text-zinc-600" />
                </div>
                <p className="text-zinc-500 text-sm font-medium">Say hi to kick things off 👋</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-1`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2.5 text-[14px] font-medium leading-relaxed break-words shadow-md ${
                      msg.sender === "me"
                        ? "bg-violet-600 text-white rounded-2xl rounded-tr-[6px]"
                        : "bg-white/[0.06] text-zinc-200 border border-white/[0.08] rounded-2xl rounded-tl-[6px]"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-white/10 bg-black/40 pb-safe">
            <form
              onSubmit={onFormSubmit}
              className="group flex items-center gap-2.5 px-4 py-3 rounded-2xl border border-white/10 bg-white/5 focus-within:border-violet-500/50 focus-within:bg-violet-600/5 transition-all duration-300"
            >
              <input
                type="text"
                value={currentText}
                onChange={(e) => setCurrentText(e.target.value)}
                placeholder="Message…"
                className="flex-1 bg-transparent text-white text-sm placeholder:text-zinc-500 focus:outline-none min-w-0"
              />
              <button
                type="submit"
                disabled={!currentText.trim()}
                className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-[10px] bg-violet-600 hover:bg-violet-500 disabled:bg-white/5 disabled:text-zinc-600 text-white transition-all duration-200 active:scale-95 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(124,58,237,0.3)] disabled:shadow-none"
              >
                <Send
                  size={15}
                  strokeWidth={2.5}
                  className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform"
                />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}



// "use client";

// import { useEffect, useRef, useState } from "react";
// import { useSocket } from "@/hooks/useSocket";
// import { useAuth } from "@/context/AuthContext";
// import { useStrangerVideoChat } from "@/hooks/useStrangerVideoChat";
// import { useWebRTC } from "@/hooks/useWebRTC";
// import {
//   Mic,
//   MicOff,
//   Video as VideoIcon,
//   VideoOff,
//   Loader2,
//   MessageSquare,
//   Send,
//   X,
//   ArrowLeft,
// } from "lucide-react";
// import Link from "next/link";
// import { useRouter } from "next/navigation";

// export default function YapPage() {
//   const { user, loading } = useAuth();
//   const router = useRouter();
//   const socket = useSocket();

//   const [currentText, setCurrentText] = useState("");
//   const chatEndRef = useRef<HTMLDivElement>(null);

//   // 1. Hook for Matchmaking & Chat logic
//   const {
//     status,
//     roomId,
//     timerEnded,
//     friendStatus,
//     incomingRequest,
//     showFriendBanner,
//     setShowFriendBanner,
//     messages,
//     unreadCount,
//     isChatOpen,
//     setIsChatOpen,
//     findMatch,
//     sendMessage,
//     sendFriendRequest,
//     acceptFriendRequest,
//     rejectFriendRequest,
//   } = useStrangerVideoChat(socket, user);

//   // 2. Hook for Camera & WebRTC logic
//   // 🔥 FIX: Yahan se 'remoteStream' hata diya gaya hai kyunki hume sirf Refs ki zaroorat hai
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

//   // Start call when matched
//   useEffect(() => {
//     if (roomId) {
//       startCall();
//       socket?.emit("startYap", roomId);
//     }
//   }, [roomId, startCall, socket]);

//   // Auto-scroll chat
//   useEffect(() => {
//     chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages, isChatOpen]);

//   const onFormSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!currentText.trim()) return;
//     sendMessage(currentText);
//     setCurrentText("");
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
//       {/* Back Button */}
//       <Link
//         href="/"
//         className="absolute top-6 left-6 z-50 p-3 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white transition-all"
//       >
//         <ArrowLeft size={24} />
//       </Link>

//       {/* Remote Video */}
//       <video
//         ref={remoteVideoRef}
//         autoPlay
//         playsInline
//         className="absolute inset-0 w-full h-full object-cover"
//       />

//       {/* Local Video */}
//       <div className="absolute bottom-24 right-6 w-32 h-48 md:w-48 md:h-64 bg-zinc-900 rounded-xl overflow-hidden shadow-2xl border border-white/10 z-10">
//         <video
//           ref={localVideoRef}
//           autoPlay
//           playsInline
//           muted
//           className="w-full h-full object-cover transform scale-x-[-1]"
//         />
//       </div>

//       {/* Pre-match Overlay */}
//       {(status === "idle" || status === "searching") && (
//         <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-20 px-4">
//           {status === "searching" ? (
//             <div className="flex flex-col items-center gap-4 text-white animate-in fade-in zoom-in duration-300">
//               <div className="relative">
//                 <Loader2 className="w-12 h-12 animate-spin text-violet-500 relative z-10" />
//                 <div className="absolute inset-0 bg-violet-500/20 blur-xl rounded-full animate-pulse" />
//               </div>
//               <p className="text-lg font-medium tracking-widest uppercase text-violet-300">
//                 Finding a match...
//               </p>
//             </div>
//           ) : (
//             <div className="flex flex-col items-center text-center max-w-lg animate-in fade-in slide-in-from-bottom-8 duration-700">
//               <div className="w-24 h-24 bg-violet-600/20 border border-violet-500/30 rounded-full flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(124,58,237,0.2)]">
//                 <VideoIcon size={40} className="text-violet-400" />
//               </div>
//               <h2 className="text-4xl md:text-5xl font-black mb-4 text-white tracking-tight">
//                 Video Chaos
//               </h2>
//               <p className="text-zinc-400 mb-10 text-lg leading-relaxed">
//                 Face-to-face connections. You have exactly{" "}
//                 <strong className="text-white">2 minutes</strong> to pass the
//                 vibe check. If you both click it off, you can become friends and
//                 chat forever. Be kind, be weird, have fun.
//               </p>
//               <button
//                 onClick={findMatch}
//                 className="px-10 py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-full font-bold text-xl transition-all shadow-[0_0_40px_rgba(124,58,237,0.5)] hover:scale-105 active:scale-95 flex items-center gap-3"
//               >
//                 <VideoIcon size={24} /> Start Yapping
//               </button>
//             </div>
//           )}
//         </div>
//       )}

//       {/* --- FRIENDSHIP UI SECTION --- */}
//       <div className="absolute top-24 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-3 w-full max-w-sm px-4">
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

//         {incomingRequest && friendStatus !== "friends" && (
//           <div className="flex flex-col items-center gap-3 p-5 bg-violet-900/95 backdrop-blur-xl border border-violet-400/50 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 w-full">
//             <p className="text-white font-bold text-[15px]">
//               Wants to be your friend!
//             </p>
//             <div className="flex items-center gap-3 w-full mt-1">
//               <button
//                 onClick={rejectFriendRequest}
//                 className="flex-1 py-2.5 bg-red-500/20 hover:bg-red-500 text-red-100 hover:text-white border border-red-500/50 hover:border-red-500 rounded-xl font-semibold transition-all"
//               >
//                 Reject
//               </button>
//               <button
//                 onClick={acceptFriendRequest}
//                 className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/30 rounded-xl font-bold transition-all"
//               >
//                 Accept
//               </button>
//             </div>
//           </div>
//         )}

//         {timerEnded &&
//           friendStatus !== "friends" &&
//           !incomingRequest &&
//           !showFriendBanner && (
//             <button
//               onClick={sendFriendRequest}
//               disabled={friendStatus === "sent"}
//               className={`px-8 py-3 rounded-full font-bold transition-all shadow-lg ${
//                 friendStatus === "sent"
//                   ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
//                   : "bg-green-600 hover:bg-green-700 text-white hover:scale-105 active:scale-95"
//               }`}
//             >
//               {friendStatus === "sent" ? "Request Sent..." : "Add Friend?"}
//             </button>
//           )}
//       </div>

//       {/* Controls Overlay */}
//       {status === "matched" && (
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
//               onClick={() => setIsChatOpen(!isChatOpen)}
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
//       {status === "matched" && isChatOpen && (
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

//           {/* HIDDEN SCROLLBAR IMPLEMENTED HERE */}
//           <div className="flex-1 overflow-y-auto p-4 space-y-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
//                     className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${msg.sender === "me" ? "bg-violet-600 text-white rounded-tr-none" : "bg-zinc-800 text-gray-200 rounded-tl-none border border-white/5"}`}
//                   >
//                     {msg.text}
//                   </div>
//                 </div>
//               ))
//             )}
//             <div ref={chatEndRef} />
//           </div>

//           <form
//             onSubmit={onFormSubmit}
//             className="p-4 border-t border-white/10 bg-black/50"
//           >
//             <div className="flex items-center gap-2">
//               <input
//                 type="text"
//                 value={currentText}
//                 onChange={(e) => setCurrentText(e.target.value)}
//                 placeholder="Type a message..."
//                 className="flex-1 bg-zinc-900 border border-white/10 rounded-full px-4 py-2 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors"
//               />
//               <button
//                 type="submit"
//                 disabled={!currentText.trim()}
//                 className="p-2 bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-full transition-colors"
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
