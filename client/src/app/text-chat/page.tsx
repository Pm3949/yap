"use client";

import { useEffect, useState, useRef } from "react";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/context/AuthContext";
import { useStrangerTextChat } from "@/hooks/useStrangerTextChat";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image"; // 🔥 IMAGE IMPORT KIYA
import {
  Send, X, UserPlus, Check,
  Loader2, ArrowLeft,
  ChevronRight, MessageSquare,
  Sparkles, Hash, FastForward,
  CheckCircle2, CornerDownLeft
} from "lucide-react";

export default function TextChatPage() {
  const { user, loading } = useAuth();
  const socket = useSocket();
  const router = useRouter();

  // 🔥 Hydration error rokne ke liye isMounted state
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const [currentText, setCurrentText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ── Hook logic for Matchmaking & Chat ──
  const {
    status,
    timerEnded,
    messages,
    friendStatus,
    findMatch,
    handleNext,
    sendMessage,
    sendFriendRequest,
    acceptFriendRequest,
  } = useStrangerTextChat(socket, user);

  // ── Auth Guard ──
  useEffect(() => {
    if (isMounted && !loading && !user) {
      router.push("/");
    }
  }, [user, loading, router, isMounted]);

  // ── Auto-scroll chat ──
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, status]);

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentText.trim()) return;
    sendMessage(currentText);
    setCurrentText("");
  };

  /* ── GLOBAL LOADING SCREEN ── */
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

  const isChatting = status === "matched";

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden flex flex-col bg-[#050507] font-sans text-white">
      
      {/* ── Ambient Glows ── */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-violet-600/7 blur-[160px]" />
        <div className="absolute -bottom-32 right-0 w-[400px] h-[400px] rounded-full bg-violet-900/7 blur-[130px]" />
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          HEADER
      ════════════════════════════════════════════════════════════════════ */}
      <header className="relative z-20 flex items-center justify-between px-5 py-4 border-b border-white/[0.08] bg-[#050507]/40 backdrop-blur-2xl flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center justify-center w-10 h-10 rounded-xl border border-white/8 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all duration-200 active:scale-95">
            <ArrowLeft size={18} strokeWidth={2} />
          </Link>
          
          {/* 🔥 AAPKA NAYA NEON LOGO YAHAN HAI */}
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
              <Hash size={12} className="text-violet-400" />
              <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Text</span>
            </div>
          </Link>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-3">
          {isChatting && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 animate-in fade-in duration-300 shadow-[0_0_15px_-3px_rgba(16,185,129,0.2)]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-400 text-[11px] font-bold uppercase tracking-widest">Live</span>
            </div>
          )}
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════════════════
          MAIN LAYOUT — Split: Sidebar (Desktop) + Chat Area
      ════════════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 flex flex-1 overflow-hidden">

        {/* ── LEFT SIDEBAR (Hidden on mobile when chatting) ── */}
        <aside className={`flex-shrink-0 w-80 border-r border-white/8 bg-black/20 backdrop-blur-md flex flex-col transition-all duration-300 ${isChatting ? "hidden lg:flex" : "flex w-full md:w-80"}`}>
          <div className="px-6 py-6 border-b border-white/8">
            <h2 className="text-white font-black text-2xl tracking-tight leading-none">Text Chaos</h2>
            <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
              Fast-paced anonymous texting.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 px-5 py-5">
            {[
              { icon: "⚡", title: "Instant match", desc: "Connected in seconds" },
              { icon: "⏱️", title: "120s session", desc: "Add friends after timer" },
              { icon: "🔒", title: "Anonymous", desc: "No profiles shown" },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex items-center gap-4 px-4 py-3.5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-colors duration-200 group">
                <span className="text-xl w-8 text-center flex-shrink-0">{icon}</span>
                <div>
                  <p className="text-white/80 font-bold text-[14px] leading-none group-hover:text-white transition-colors">{title}</p>
                  <p className="text-zinc-500 text-xs mt-1">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex-1" />

          {/* Sidebar CTA */}
          {!isChatting && (
            <div className="px-5 pb-8">
              {status === "idle" ? (
                <button
                  onClick={findMatch}
                  className="group w-full flex items-center justify-center gap-2.5 py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-bold text-[15px] tracking-tight transition-all duration-200 active:scale-[0.97] shadow-[0_0_30px_-5px_rgba(124,58,237,0.5)]"
                >
                  <Sparkles size={18} />
                  Start Chatting
                  <ChevronRight size={16} className="opacity-50 group-hover:translate-x-1 transition-transform duration-200" />
                </button>
              ) : (
                <div className="flex flex-col items-center gap-4 py-6 border border-white/10 bg-white/5 rounded-2xl">
                  <Loader2 className="w-8 h-8 text-violet-400 animate-spin" strokeWidth={2.5} />
                  <p className="text-violet-300/80 text-sm font-bold tracking-widest uppercase">Searching…</p>
                </div>
              )}
            </div>
          )}
        </aside>

        {/* ── CHAT AREA ── */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#050507]/50 relative">
          
          {/* ── IDLE / SEARCHING (Center state when no chat) ── */}
          {!isChatting && (
            <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8">
              {status === "idle" && (
                <div className="flex flex-col items-center gap-6 text-center max-w-sm animate-in fade-in zoom-in-95 duration-500 hidden md:flex">
                  <div className="w-24 h-24 rounded-[32px] border border-white/8 bg-white/5 flex items-center justify-center shadow-[0_0_50px_rgba(124,58,237,0.15)]">
                    <MessageSquare size={40} className="text-violet-400" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-white font-black text-3xl tracking-tight">Ready to Yap?</h3>
                    <p className="text-zinc-400 text-base mt-3 leading-relaxed">
                      You have exactly <strong className="text-white">2 minutes</strong> to make an impression. Be kind, be weird, have fun.
                    </p>
                  </div>
                </div>
              )}

              {status === "searching" && (
                <div className="flex flex-col items-center gap-8 text-center animate-in fade-in duration-300">
                  <div className="relative flex items-center justify-center w-32 h-32">
                    <div className="absolute inset-[-10px] rounded-full border border-violet-500/10 animate-[ping_3s_ease-in-out_infinite]" />
                    <div className="absolute inset-2 rounded-full border border-violet-500/20 animate-[ping_2s_ease-in-out_infinite_0.4s]" />
                    <div className="relative w-16 h-16 rounded-[20px] border border-violet-500/30 bg-violet-600/15 flex items-center justify-center backdrop-blur-md">
                      <Loader2 className="w-8 h-8 text-violet-400 animate-spin" strokeWidth={2.5} />
                    </div>
                  </div>
                  <div>
                    <p className="text-white font-black text-2xl tracking-tight">Finding a stranger…</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── ACTIVE CHAT ── */}
          {isChatting && (
            <>
              {/* Top Banner Area (Friendship Status) */}
              <div className="flex-shrink-0 flex flex-col px-4 pt-4 z-10">
                {timerEnded && (
                  <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                    {friendStatus === "none" && (
                      <div className="flex items-center justify-between px-5 py-3.5 rounded-2xl border border-violet-500/20 bg-violet-600/10 backdrop-blur-xl shadow-lg">
                        <p className="text-violet-200 text-sm font-semibold">Timer ended — great chat?</p>
                        <button
                          onClick={sendFriendRequest}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs transition-all active:scale-95 shadow-[0_0_15px_rgba(124,58,237,0.4)]"
                        >
                          <UserPlus size={14} /> Add Friend
                        </button>
                      </div>
                    )}
                    {friendStatus === "sent" && (
                      <div className="flex items-center justify-between px-5 py-3.5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
                        <p className="text-zinc-300 text-sm font-semibold">Friend request sent</p>
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/40 text-zinc-400 font-bold text-xs">
                          <Loader2 size={14} className="animate-spin" /> Waiting...
                        </div>
                      </div>
                    )}
                    {friendStatus === "received" && (
                      <div className="flex items-center justify-between px-5 py-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-600/15 backdrop-blur-xl shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                        <p className="text-emerald-100 text-sm font-bold">They sent a friend request!</p>
                        <button
                          onClick={acceptFriendRequest}
                          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs transition-all active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-bounce"
                        >
                          <Check size={14} strokeWidth={3} /> Accept
                        </button>
                      </div>
                    )}
                    {friendStatus === "friends" && (
                      <div className="flex items-center justify-between px-5 py-3.5 rounded-2xl border border-emerald-500/40 bg-emerald-500/20 backdrop-blur-xl shadow-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <Check size={16} className="text-emerald-400" strokeWidth={3} />
                          </div>
                          <p className="text-emerald-100 text-sm font-bold">You are now friends! 🎉</p>
                        </div>
                        <button
                          onClick={() => router.push("/friends")}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all active:scale-95"
                        >
                          <CheckCircle2 size={14} /> Go to DMs
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <div className="text-center text-[10px] font-black text-zinc-600 mb-6 uppercase tracking-[0.2em]">
                  Secure Session Started
                </div>

                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.sender === "me" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                    <div className={`max-w-[85%] md:max-w-[70%] px-5 py-3.5 text-[14.5px] font-medium leading-relaxed break-words rounded-2xl shadow-sm ${
                      msg.sender === "me"
                        ? "bg-violet-600 text-white rounded-br-[6px] shadow-[0_5px_20px_-5px_rgba(124,58,237,0.4)]"
                        : "bg-white/[0.06] border border-white/[0.08] text-zinc-200 rounded-bl-[6px]"
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} className="h-2" />
              </div>

              {/* Input Area */}
              <div className="flex-shrink-0 px-4 pb-6 pt-3 bg-gradient-to-t from-[#050507] to-transparent">
                <form
                  onSubmit={onFormSubmit}
                  className="flex gap-2.5 max-w-4xl mx-auto"
                >
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex-shrink-0 px-4 py-3.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-[18px] text-red-400 hover:text-red-300 transition-all flex items-center justify-center gap-2 group active:scale-95"
                    title="Skip"
                  >
                    <FastForward size={20} className="group-hover:translate-x-0.5 transition-transform" />
                    <span className="hidden sm:inline font-bold text-xs uppercase tracking-widest">
                      Skip
                    </span>
                  </button>

                  <div className="flex-1 relative group bg-white/5 border border-white/10 rounded-[18px] focus-within:border-violet-500/50 focus-within:bg-white/[0.08] transition-all flex items-center">
                    <input
                      type="text"
                      value={currentText}
                      onChange={(e) => setCurrentText(e.target.value)}
                      placeholder="Type a message…"
                      className="w-full bg-transparent px-5 py-3.5 text-white text-sm placeholder:text-zinc-500 focus:outline-none"
                    />
                    {currentText.trim() && (
                      <div className="absolute right-4 hidden sm:flex items-center gap-1 text-zinc-500 pointer-events-none">
                        <CornerDownLeft size={14} />
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={!currentText.trim()}
                    className="flex-shrink-0 w-14 h-14 flex items-center justify-center bg-violet-600 hover:bg-violet-500 disabled:bg-white/5 disabled:text-zinc-600 rounded-[18px] text-white transition-all active:scale-95 disabled:scale-100 shadow-[0_0_20px_-5px_rgba(124,58,237,0.5)] disabled:shadow-none"
                  >
                    <Send size={20} className="disabled:translate-x-0 translate-x-0.5 -translate-y-0.5" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// "use client";

// import { useEffect, useState, useRef } from "react";
// import { useSocket } from "@/hooks/useSocket";
// import { useAuth } from "@/context/AuthContext";
// import { useStrangerTextChat } from "@/hooks/useStrangerTextChat";
// import {
//   Send,
//   UserPlus,
//   FastForward,
//   Loader2,
//   MessageSquare,
//   CheckCircle2,
//   ArrowLeft,
// } from "lucide-react";
// import Link from "next/link";
// import { useRouter } from "next/navigation";

// export default function TextChatPage() {
//   const { user, loading } = useAuth();
//   const socket = useSocket();
//   const router = useRouter();

//   const [currentText, setCurrentText] = useState("");
//   const chatEndRef = useRef<HTMLDivElement>(null);

//   const {
//     status,
//     timerEnded,
//     messages,
//     friendStatus,
//     findMatch,
//     handleNext,
//     sendMessage,
//     sendFriendRequest,
//     acceptFriendRequest,
//   } = useStrangerTextChat(socket, user);

//   useEffect(() => {
//     if (!loading && !user) {
//       router.push("/");
//     }
//   }, [user, loading, router]);

//   useEffect(() => {
//     chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

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
//     <div className="flex flex-col h-screen bg-black text-white">
//       {/* --- FIXED HEADER --- */}
//       <header className="p-4 border-b border-white/10 flex items-center justify-between bg-zinc-950 z-20 relative">
//         {/* Left Section: Back Button + Logo */}
//         <div className="flex items-center gap-4">
//           <Link
//             href="/"
//             className="p-2 hover:bg-white/5 rounded-full text-zinc-400 hover:text-white transition-all"
//           >
//             <ArrowLeft size={22} />
//           </Link>

//           <Link
//             href="/"
//             className="font-black tracking-tighter text-xl flex items-center"
//           >
//             YAP<span className="text-violet-500">.</span>
//             <span className="ml-2 text-[10px] bg-white/5 px-2 py-0.5 rounded border border-white/10 text-zinc-400 uppercase tracking-tighter">
//               Text
//             </span>
//           </Link>
//         </div>

//         {/* Right Section: Dynamic Actions */}
//         {status === "matched" && (
//           <div className="flex items-center gap-2">
//             {timerEnded ? (
//               <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-300">
//                 {friendStatus === "none" && (
//                   <button
//                     onClick={sendFriendRequest}
//                     className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-full font-bold text-xs flex items-center gap-2 transition-transform active:scale-95"
//                   >
//                     <UserPlus size={14} /> Add Friend
//                   </button>
//                 )}

//                 {friendStatus === "sent" && (
//                   <div className="px-4 py-2 bg-zinc-800 text-gray-400 rounded-full font-bold text-xs flex items-center gap-2">
//                     <Loader2 size={12} className="animate-spin" /> Sent
//                   </div>
//                 )}

//                 {friendStatus === "received" && (
//                   <button
//                     onClick={acceptFriendRequest}
//                     className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-full font-bold text-xs animate-bounce shadow-lg shadow-green-600/20"
//                   >
//                     Accept Request
//                   </button>
//                 )}

//                 {friendStatus === "friends" && (
//                   <button
//                     onClick={() => router.push("/friends")}
//                     className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-full font-bold text-xs flex items-center gap-2 transition-all hover:scale-105"
//                   >
//                     <CheckCircle2 size={14} /> Go to DMs
//                   </button>
//                 )}
//               </div>
//             ) : (
//               <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-full">
//                 <span className="relative flex h-2 w-2">
//                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
//                   <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
//                 </span>
//                 <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest">
//                   Live Chat
//                 </span>
//               </div>
//             )}
//           </div>
//         )}
//       </header>

//       {/* --- MAIN CONTENT --- */}
//       <div className="flex-1 flex flex-col relative overflow-hidden">
//         {/* IDLE STATE */}
//         {status === "idle" && (
//           <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in slide-in-from-bottom-8 duration-500 max-w-lg mx-auto">
//             <div className="w-24 h-24 bg-violet-600/20 border border-violet-500/30 rounded-full flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(124,58,237,0.2)]">
//               <MessageSquare size={40} className="text-violet-400" />
//             </div>
//             <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
//               Text Chaos
//             </h2>
//             <p className="text-zinc-400 mb-10 text-lg leading-relaxed">
//               Fast-paced anonymous texting. You have exactly{" "}
//               <strong className="text-white">2 minutes</strong> to make an
//               impression.
//             </p>
//             <button
//               onClick={findMatch}
//               className="px-10 py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-full font-bold text-xl shadow-[0_0_40px_rgba(124,58,237,0.4)] transition-transform hover:scale-105 active:scale-95 flex items-center gap-3"
//             >
//               <MessageSquare size={24} /> Start Texting
//             </button>
//           </div>
//         )}

//         {/* SEARCHING STATE */}
//         {status === "searching" && (
//           <div className="flex-1 flex flex-col items-center justify-center">
//             <Loader2 size={48} className="text-violet-500 animate-spin mb-4" />
//             <h2 className="text-xl font-bold animate-pulse tracking-tight text-zinc-400">
//               SEARCHING...
//             </h2>
//           </div>
//         )}

//         {/* MATCHED STATE */}
//         {status === "matched" && (
//           <>
//             <div className="flex-1 overflow-y-auto p-4 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
//               <div className="text-center text-[10px] font-black text-zinc-600 my-4 uppercase tracking-[0.2em]">
//                 You are chatting with a stranger
//               </div>

//               {messages.map((msg, idx) => (
//                 <div
//                   key={idx}
//                   className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
//                 >
//                   <div
//                     className={`max-w-[85%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
//                       msg.sender === "me"
//                         ? "bg-violet-600 text-white rounded-br-none"
//                         : "bg-zinc-800 text-gray-200 rounded-tl-none border border-white/5"
//                     }`}
//                   >
//                     {msg.text}
//                   </div>
//                 </div>
//               ))}
//               <div ref={chatEndRef} />
//             </div>

//             <div className="p-4 bg-zinc-950 border-t border-white/5 pb-8 sm:pb-4">
//               <form
//                 onSubmit={onFormSubmit}
//                 className="flex gap-2 max-w-4xl mx-auto"
//               >
//                 <button
//                   type="button"
//                   onClick={handleNext}
//                   className="p-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl text-gray-400 transition-colors flex items-center gap-2 group"
//                   title="Skip"
//                 >
//                   <FastForward size={20} className="group-hover:text-white" />
//                   <span className="hidden sm:inline font-bold text-xs uppercase tracking-widest text-zinc-500 group-hover:text-white">
//                     Skip
//                   </span>
//                 </button>

//                 <input
//                   type="text"
//                   value={currentText}
//                   onChange={(e) => setCurrentText(e.target.value)}
//                   placeholder="Message stranger..."
//                   className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-violet-500 transition-colors text-sm"
//                 />

//                 <button
//                   type="submit"
//                   disabled={!currentText.trim()}
//                   className="p-3 bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-800 disabled:text-zinc-600 rounded-xl transition-all"
//                 >
//                   <Send size={20} />
//                 </button>
//               </form>
//             </div>
//           </>
//         )}
//       </div>
//     </div>
//   );
// }
