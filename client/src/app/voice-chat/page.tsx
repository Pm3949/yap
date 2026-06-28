"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/context/AuthContext";
import { useStrangerVoiceChat } from "@/hooks/useStrangerVoiceChat";
import Image from "next/image";
import {
  Mic,
  MicOff,
  Loader2,
  UserPlus,
  FastForward,
  PhoneCall,
  ArrowLeft,
  Radio,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function VoiceChatPage() {
  const { user, loading } = useAuth();
  const socket = useSocket();
  const router = useRouter();

  // 🔥 FIX: Hydration error rokne ke liye isMounted state
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const {
    status,
    isMuted,
    timerEnded,
    roomId,
    remoteAudio,
    findMatch,
    handleNext,
    toggleMute,
  } = useStrangerVoiceChat(socket, user);

  useEffect(() => {
    if (isMounted && !loading && !user) router.push("/");
  }, [user, loading, router, isMounted]);

  /* ── Global Loading Screen (Hydration Safe) ── */
  if (!isMounted || loading)
    return (
      <div className="h-screen flex items-center justify-center bg-[#050507]">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[140px]" />
        </div>
        {/* Spinner card */}
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
    <div className="flex flex-col h-screen text-white relative overflow-hidden bg-[#050507]">
      {/* ── Hidden Audio Element for Voice Chat ── */}
      <audio ref={remoteAudio} autoPlay />

      {/* ── Ambient Glow Layer ── */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[150px]" />
        <div className="absolute -bottom-20 -right-20 w-[300px] h-[300px] rounded-full bg-violet-900/10 blur-[100px]" />
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          HEADER
      ══════════════════════════════════════════════════════════════════════ */}
      <header className="relative z-20 flex items-center justify-between px-5 py-4 border-b border-white/[0.06] bg-[#050507]/40 backdrop-blur-2xl">
        <div className="flex items-center gap-4">
          {/* Back button */}
          <Link
            href="/"
            className="flex items-center justify-center w-10 h-10 rounded-xl border border-white/8 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all duration-200 active:scale-95"
            title="Go back"
          >
            <ArrowLeft size={18} strokeWidth={2} />
          </Link>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <Image 
              src="/yap-logo-wordmark.png" 
              alt="YAP Logo" 
              width={100} 
              height={32} 
              className="h-7 sm:h-8 w-auto mix-blend-screen drop-shadow-[0_0_15px_rgba(192,38,211,0.4)]" 
              priority 
            />
            {/* Mode badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-white/10 bg-white/5">
              <Radio size={12} className="text-violet-400" />
              <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
                Voice
              </span>
            </div>
          </Link>
        </div>

        {/* Live indicator — shown only when matched */}
        {status === "matched" && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 animate-in fade-in duration-300 shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-400 text-[11px] font-bold uppercase tracking-widest">
              Live
            </span>
          </div>
        )}
      </header>

      {/* ══════════════════════════════════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════════════════════════════════ */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6">

        {/* ── IDLE STATE ── */}
        {status === "idle" && (
          <div className="w-full max-w-lg flex flex-col items-center gap-8 animate-in fade-in zoom-in-95 duration-500">
            {/* Icon Badge */}
            <div className="relative">
              <div className="w-28 h-28 rounded-[32px] border border-violet-500/20 bg-violet-600/10 flex items-center justify-center shadow-[0_0_60px_rgba(124,58,237,0.2)]">
                <Mic size={44} className="text-violet-400" strokeWidth={1.5} />
              </div>
              {/* Decorative outer ring */}
              <div className="absolute -inset-4 rounded-[44px] border border-violet-500/10" />
            </div>

            {/* Copy */}
            <div className="flex flex-col items-center gap-4 text-center">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-none text-white">
                Voice Chaos
              </h2>
              <p className="text-zinc-400 text-base md:text-lg leading-relaxed max-w-[340px]">
                Pure conversation. No cameras, no visual bias. You get{" "}
                <span className="text-white font-bold">120 seconds</span> to talk.
                If the energy matches, add them as a friend.
              </p>
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { icon: "🎙️", label: "Audio only" },
                { icon: "⚡", label: "Instant match" },
                { icon: "🔒", label: "Anonymous" },
              ].map(({ icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-zinc-300 text-xs font-semibold tracking-wide"
                >
                  <span>{icon}</span>
                  {label}
                </div>
              ))}
            </div>

            {/* CTA */}
            <button
              onClick={findMatch}
              className="mt-2 group flex items-center gap-3 px-10 py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-bold text-[16px] tracking-tight transition-all duration-200 active:scale-[0.97] shadow-[0_0_30px_-5px_rgba(124,58,237,0.6)]"
            >
              <PhoneCall size={20} strokeWidth={2} />
              Find a Stranger
              <FastForward
                size={16}
                className="opacity-60 group-hover:translate-x-1 transition-transform duration-200"
              />
            </button>
          </div>
        )}

        {/* ── SEARCHING STATE ── */}
        {status === "searching" && (
          <div className="flex flex-col items-center gap-10 animate-in fade-in duration-500">
            {/* Layered pulse rings */}
            <div className="relative flex items-center justify-center w-32 h-32">
              <div className="absolute inset-[-20px] rounded-full border border-violet-500/10 animate-[ping_3s_ease-in-out_infinite]" />
              <div className="absolute inset-0 rounded-full border border-violet-500/20 animate-[ping_2.2s_ease-in-out_infinite_0.4s]" />
              <div className="absolute inset-4 rounded-full border border-violet-500/30 animate-[ping_1.5s_ease-in-out_infinite_0.8s]" />
              <div className="relative w-16 h-16 rounded-[20px] border border-violet-500/40 bg-violet-600/20 flex items-center justify-center backdrop-blur-md shadow-[0_0_30px_rgba(124,58,237,0.3)]">
                <Loader2 className="w-8 h-8 text-violet-400 animate-spin" strokeWidth={2.5} />
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 text-center">
              <h2 className="text-2xl font-black tracking-tight text-white">
                Finding your match…
              </h2>
              <p className="text-violet-400/60 text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <Radio size={14} className="text-violet-500 animate-pulse" />
                Scanning the Yapperverse
              </p>
            </div>

            {/* Cancel option */}
            <button
              onClick={() => router.push("/")}
              className="px-6 py-2.5 rounded-full text-zinc-500 hover:text-white hover:bg-white/5 text-sm font-semibold transition-all duration-200 mt-4"
            >
              Cancel Search
            </button>
          </div>
        )}

        {/* ── MATCHED STATE ── */}
        {status === "matched" && (
          <div className="w-full max-w-md flex flex-col items-center gap-12 animate-in fade-in slide-in-from-bottom-8 duration-500">

            {/* Avatar + Pulse rings */}
            <div className="relative flex items-center justify-center mt-8">
              {/* Outer decorative rings */}
              <div className="absolute w-64 h-64 rounded-full border border-violet-500/10 animate-[ping_4s_ease-in-out_infinite]" />
              <div className="absolute w-52 h-52 rounded-full border border-violet-500/20 animate-[ping_3s_ease-in-out_infinite_0.5s]" />

              {/* Avatar glass card */}
              <div className="relative w-40 h-40 rounded-full border border-white/10 bg-white/5 backdrop-blur-md flex items-center justify-center shadow-[0_0_50px_rgba(124,58,237,0.15)]">
                <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/10 pointer-events-none" />
                {/* Initials / icon */}
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-600/30 to-fuchsia-600/30 border border-violet-500/30 flex items-center justify-center shadow-inner">
                  <span className="text-4xl font-black text-violet-300">?</span>
                </div>
              </div>
            </div>

            {/* Status Copy */}
            <div className="flex flex-col items-center gap-3 text-center">
              <h3 className="text-3xl font-black tracking-tight text-white">
                Stranger Connected
              </h3>
              <p className="text-zinc-400 text-sm font-medium">
                You have <span className="text-white font-bold">120 seconds</span> — make it count.
              </p>
            </div>

            {/* Glass Controls Dock */}
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-4 px-6 py-4 rounded-[32px] border border-white/10 bg-black/50 backdrop-blur-2xl shadow-2xl">
                
                {/* Mute Button */}
                <button
                  onClick={toggleMute}
                  aria-label={isMuted ? "Unmute" : "Mute"}
                  className={`flex items-center justify-center w-14 h-14 rounded-[20px] transition-all duration-200 active:scale-95 ${
                    isMuted
                      ? "bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                      : "bg-white/10 border border-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  {isMuted ? <MicOff size={22} strokeWidth={2.5} /> : <Mic size={22} strokeWidth={2.5} />}
                </button>

                <div className="w-px h-8 bg-white/10 mx-1" />

                {/* Skip Button */}
                <button
                  onClick={handleNext}
                  aria-label="Skip to next stranger"
                  className="group flex items-center gap-2.5 px-6 h-14 rounded-[20px] border border-white/10 bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-all duration-200 active:scale-95"
                >
                  <FastForward size={20} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform duration-200" />
                  Skip
                </button>

                {/* Add Friend — Unlocks after timer */}
                {timerEnded && (
                  <>
                    <div className="w-px h-8 bg-white/10 mx-1" />
                    <button
                      onClick={() => socket?.emit("sendFriendRequest", { roomId })}
                      aria-label="Send friend request"
                      className="group flex items-center justify-center w-14 h-14 rounded-[20px] bg-violet-600 hover:bg-violet-500 text-white transition-all duration-200 active:scale-95 shadow-[0_0_25px_-5px_rgba(124,58,237,0.6)] animate-in zoom-in-95 duration-300"
                      title="Add Friend"
                    >
                      <UserPlus size={22} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
                    </button>
                  </>
                )}
              </div>

              {/* Timer unlocked hint */}
              {timerEnded && (
                <p className="text-violet-400/80 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-500">
                  ✨ Time's up! You can now send a friend request.
                </p>
              )}
            </div>

          </div>
        )}
      </main>
    </div>
  );
}


// "use client";

// import { useEffect } from "react";
// import { useSocket } from "@/hooks/useSocket";
// import { useAuth } from "@/context/AuthContext";
// import { useStrangerVoiceChat } from "@/hooks/useStrangerVoiceChat";
// import {
//   Mic,
//   MicOff,
//   PhoneOff,
//   Loader2,
//   UserPlus,
//   FastForward,
//   UserCircle,
//   PhoneCall,
//   ArrowLeft,
// } from "lucide-react";
// import Link from "next/link";
// import { useRouter } from "next/navigation";

// export default function VoiceChatPage() {
//   const { user, loading } = useAuth();
//   const socket = useSocket();
//   const router = useRouter();

//   // Extract all the complex logic from our new hook
//   const {
//     status,
//     isMuted,
//     timerEnded,
//     roomId,
//     remoteAudio,
//     findMatch,
//     handleNext,
//     toggleMute,
//   } = useStrangerVoiceChat(socket, user);

//   useEffect(() => {
//     if (!loading && !user) {
//       router.push("/");
//     }
//   }, [user, loading, router]);

//   if (loading)
//     return (
//       <div className="h-screen bg-black flex items-center justify-center">
//         <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
//       </div>
//     );
//   if (!user) return null;

//   return (
//     <div className="flex flex-col h-screen bg-black text-white relative overflow-hidden">
//       <audio ref={remoteAudio} autoPlay />

//       <header className="p-4 border-b border-white/10 flex items-center justify-between bg-zinc-950 z-20">
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
//               Voice
//             </span>
//           </Link>
//         </div>
//       </header>

//       <main className="flex-1 flex flex-col items-center justify-center p-6 relative">
//         {/* Glow background */}
//         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none" />

//         {/* IDLE STATE */}
//         {status === "idle" && (
//           <div className="text-center animate-in fade-in zoom-in duration-500 max-w-lg mx-auto flex flex-col items-center">
//             <div className="w-24 h-24 bg-violet-600/20 border border-violet-500/30 rounded-full flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(124,58,237,0.2)]">
//               <Mic size={40} className="text-violet-400" />
//             </div>
//             <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
//               Voice Chaos
//             </h2>
//             <p className="text-zinc-400 mb-10 text-lg leading-relaxed">
//               Pure conversation. No cameras, no visual bias. You have{" "}
//               <strong className="text-white">120 seconds</strong> to talk about
//               anything. If the energy matches, add them to your Friends list to
//               unlock unlimited calling.
//             </p>
//             <button
//               onClick={findMatch}
//               className="px-10 py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-full font-bold text-xl transition-transform hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(124,58,237,0.4)] flex items-center gap-3"
//             >
//               <PhoneCall size={24} /> Find a Stranger
//             </button>
//           </div>
//         )}

//         {/* SEARCHING STATE */}
//         {status === "searching" && (
//           <div className="text-center flex flex-col items-center">
//             <div className="relative mb-8">
//               <Loader2 size={64} className="animate-spin text-violet-500" />
//               <div className="absolute inset-0 animate-ping bg-violet-500/20 rounded-full" />
//             </div>
//             <h2 className="text-xl font-bold animate-pulse tracking-widest text-violet-400">
//               FINDING A YAPPER...
//             </h2>
//           </div>
//         )}

//         {/* MATCHED STATE */}
//         {status === "matched" && (
//           <div className="w-full max-w-md flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-500">
//             {/* Pulsing Avatar */}
//             <div className="relative mb-12">
//               <div className="w-44 h-44 bg-zinc-900 rounded-full border-4 border-violet-500/30 flex items-center justify-center overflow-hidden z-10 relative">
//                 <UserCircle className="w-36 h-36 text-zinc-800" />
//               </div>
//               <div className="absolute inset-0 rounded-full border-4 border-violet-500 animate-[ping_3s_linear_infinite] opacity-10" />
//               <div className="absolute inset-0 rounded-full border-2 border-violet-500 animate-[ping_2s_linear_infinite] opacity-5" />
//             </div>

//             <div className="text-center mb-12">
//               <h3 className="text-2xl font-black mb-1">Stranger Connected</h3>
//               <div className="flex items-center justify-center gap-2">
//                 <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
//                 <p className="text-green-500 text-xs font-bold uppercase tracking-widest">
//                   Live Audio
//                 </p>
//               </div>
//             </div>

//             {/* Controls */}
//             <div className="flex gap-4 md:gap-6 items-center">
//               <button
//                 onClick={toggleMute}
//                 className={`p-5 md:p-6 rounded-full transition-all ${isMuted ? "bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]" : "bg-zinc-800 hover:bg-zinc-700"}`}
//               >
//                 {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
//               </button>

//               <button
//                 onClick={handleNext}
//                 className="p-5 md:p-6 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full transition-all flex items-center gap-2 group"
//               >
//                 <FastForward
//                   size={24}
//                   className="group-hover:translate-x-1 transition-transform"
//                 />
//                 <span className="hidden sm:inline font-bold">Skip</span>
//               </button>

//               {timerEnded && (
//                 <button
//                   onClick={() => socket?.emit("sendFriendRequest", { roomId })}
//                   className="p-5 md:p-6 bg-violet-600 hover:bg-violet-500 rounded-full shadow-[0_0_30px_rgba(124,58,237,0.5)] animate-bounce"
//                 >
//                   <UserPlus size={24} />
//                 </button>
//               )}
//             </div>
//           </div>
//         )}
//       </main>
//     </div>
//   );
// }
