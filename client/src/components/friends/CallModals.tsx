"use client";

import { Video, Phone, PhoneOff, PhoneCall, UserCircle, Mic, MicOff, ShieldCheck } from "lucide-react";
import { CallState, CallData } from "@/hooks/useFriendCall";

type CallModalsProps = {
  callState: CallState;
  callData: CallData;
  isMicMuted: boolean;
  toggleMic: () => void;
  acceptCall: () => void;
  rejectCall: () => void;
  endCall: () => void;
  cancelCall: () => void;
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
  remoteVideoRef: React.RefObject<HTMLVideoElement | null>;
};

export default function CallModals({ 
  callState, callData, isMicMuted, toggleMic, 
  acceptCall, rejectCall, endCall, cancelCall, 
  localVideoRef, remoteVideoRef 
}: CallModalsProps) {
  
  if (callState === "idle") return null;

  const isVideo = callData?.type === "video";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto">
      
      {/* ── OUTGOING CALL (Calling...) ─────────────────────────────────────── */}
      {callState === "calling" && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="flex flex-col items-center gap-6 animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
            {/* Pulsing Avatar/Icon */}
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-violet-500/20 animate-ping scale-150 duration-1000" />
              <div className="absolute inset-0 rounded-full bg-violet-500/40 animate-pulse scale-110" />
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-[0_0_40px_-10px_rgba(124,58,237,0.5)] relative z-10">
                {isVideo ? <Video size={40} className="text-white" /> : <Phone size={40} className="text-white" />}
              </div>
            </div>
            
            <div className="text-center mt-4">
              <p className="text-white font-black text-3xl tracking-tight mb-1">Calling…</p>
              <p className="text-violet-400 font-semibold text-sm uppercase tracking-widest">
                Secure {isVideo ? "Video" : "Voice"} Call
              </p>
            </div>

            <button
              onClick={cancelCall}
              className="mt-8 w-16 h-16 bg-red-600/90 hover:bg-red-500 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-[0_0_30px_-8px_rgba(239,68,68,0.6)] group"
              title="Cancel Call"
            >
              <PhoneOff size={24} className="text-white group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      )}

      {/* ── INCOMING CALL ─────────────────────────────────────── */}
      {callState === "incoming" && callData && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center animate-in fade-in duration-300">
          {/* Glassmorphism Card */}
          <div className="relative w-full max-w-[340px] mx-4 bg-[#0e0e12]/80 border border-white/10 backdrop-blur-2xl rounded-[32px] p-8 flex flex-col items-center shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 overflow-hidden">
            
            {/* Internal ambient glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-violet-500/20 blur-[60px] rounded-full pointer-events-none" />

            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-full bg-violet-500/30 animate-ping scale-125" />
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center relative shadow-lg shadow-violet-500/40">
                {isVideo ? <Video size={36} className="text-white" /> : <PhoneCall size={36} className="text-white" />}
              </div>
            </div>

            <div className="text-center mb-8 relative z-10">
              <p className="text-white font-black text-2xl tracking-tight leading-tight mb-1">
                {callData.callerName ?? "Someone"}
              </p>
              <p className="text-zinc-400 text-xs font-semibold uppercase tracking-widest flex items-center justify-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse" />
                Incoming {isVideo ? "Video" : "Voice"}
              </p>
            </div>

            <div className="flex items-center gap-6 w-full justify-center relative z-10">
              <button
                onClick={rejectCall}
                className="w-16 h-16 bg-red-600/90 hover:bg-red-500 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-[0_0_24px_-6px_rgba(239,68,68,0.6)]"
                title="Decline"
              >
                <PhoneOff size={24} className="text-white" />
              </button>
              <button
                onClick={acceptCall}
                className="w-16 h-16 bg-emerald-500 hover:bg-emerald-400 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-[0_0_30px_-6px_rgba(16,185,129,0.5)] animate-bounce"
                title="Accept"
              >
                {isVideo ? <Video size={24} className="text-white" /> : <PhoneCall size={24} className="text-white" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ACTIVE CALL ──────────────────────────────────── */}
      {callState === "active" && (
        <div className="absolute inset-0 bg-[#050507] flex flex-col animate-in fade-in duration-500 overflow-hidden">
          
          {/* Top Header info */}
          <div className="absolute top-0 inset-x-0 p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent z-30 pointer-events-none">
            <h2 className="text-white font-bold text-lg drop-shadow-md">
              {callData?.callerName ?? "Unknown"}
            </h2>
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
                E2E Encrypted
              </span>
            </div>
          </div>

          {/* Main Media Area */}
          <div className="flex-1 relative flex items-center justify-center">
            {isVideo ? (
              <>
                {/* Remote Video (Full Screen) */}
                <video 
                  ref={remoteVideoRef} 
                  autoPlay 
                  playsInline 
                  className="absolute inset-0 w-full h-full object-cover" 
                />
                
                {/* Local Video (Floating PIP) */}
                <div className="absolute bottom-28 right-6 w-28 h-40 md:w-36 md:h-52 bg-zinc-900 rounded-2xl overflow-hidden border border-white/20 shadow-2xl z-20 transition-all hover:scale-105">
                  <video 
                    ref={localVideoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover transform scale-x-[-1]" 
                  />
                </div>
              </>
            ) : (
              /* Voice Only UI */
              <div className="flex flex-col items-center relative w-full h-full justify-center">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none" />
                
                <div className="w-36 h-36 bg-white/[0.03] backdrop-blur-xl rounded-full flex items-center justify-center border border-violet-500/20 shadow-[0_0_60px_-15px_rgba(124,58,237,0.4)] relative z-10">
                  <div className="absolute inset-0 rounded-full border-2 border-violet-500/30 animate-[ping_3s_ease-in-out_infinite]" />
                  <UserCircle size={64} className="text-violet-400" />
                </div>
                <audio ref={remoteVideoRef} autoPlay />
              </div>
            )}
          </div>

          {/* Bottom Controls Bar */}
          <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-30 flex items-end justify-center pb-8 gap-6 pointer-events-none">
            
            {/* Mute Button */}
            <button 
              onClick={toggleMic} 
              className={`pointer-events-auto w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                isMicMuted 
                  ? "bg-white text-red-600 shadow-[0_0_20px_-5px_rgba(255,255,255,0.5)]" 
                  : "bg-white/10 hover:bg-white/20 border border-white/15 text-white backdrop-blur-md"
              }`}
              title={isMicMuted ? "Unmute Microphone" : "Mute Microphone"}
            >
              {isMicMuted ? <MicOff size={22} /> : <Mic size={22} />}
            </button>

            {/* End Call Button */}
            <button 
              onClick={endCall} 
              className="pointer-events-auto w-16 h-16 bg-red-600/90 hover:bg-red-500 rounded-full flex items-center justify-center shadow-[0_0_30px_-5px_rgba(239,68,68,0.6)] transition-all active:scale-95 group"
              title="End Call"
            >
              <PhoneOff size={26} className="text-white group-hover:scale-110 transition-transform" />
            </button>

          </div>
        </div>
      )}
    </div>
  );
}

// import { Video, Phone, PhoneOff, PhoneCall, UserCircle, Mic, MicOff } from "lucide-react";
// import { CallState, CallData } from "@/hooks/useFriendCall";

// type CallModalsProps = {
//   callState: CallState;
//   callData: CallData;
//   isMicMuted: boolean;
//   toggleMic: () => void;
//   acceptCall: () => void;
//   rejectCall: () => void;
//   endCall: () => void;
//   cancelCall: () => void;
//   localVideoRef: React.RefObject<HTMLVideoElement | null>;
//   remoteVideoRef: React.RefObject<HTMLVideoElement | null>;
// };

// export default function CallModals({ 
//   callState, callData, isMicMuted, toggleMic, 
//   acceptCall, rejectCall, endCall, cancelCall, 
//   localVideoRef, remoteVideoRef 
// }: CallModalsProps) {
//   if (callState === "idle") return null;

//   return (
//     <>
//       {/* INCOMING CALL MODAL */}
//       {callState === "incoming" && callData && (
//         <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center">
//           <div className="bg-zinc-900 p-8 rounded-3xl flex flex-col items-center border border-white/10 shadow-2xl animate-in zoom-in">
//             <div className="w-24 h-24 bg-violet-600/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
//               <PhoneCall size={48} className="text-violet-500" />
//             </div>
//             <h2 className="text-2xl font-bold mb-2">{callData.callerName} is calling...</h2>
//             <p className="text-zinc-400 mb-8 uppercase tracking-widest text-xs">Incoming {callData.type} call</p>
//             <div className="flex gap-6">
//               <button onClick={rejectCall} className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-transform hover:scale-105">
//                 <PhoneOff size={24} />
//               </button>
//               <button onClick={acceptCall} className="w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center transition-transform hover:scale-105 animate-bounce">
//                 {callData.type === "video" ? <Video size={24} /> : <Phone size={24} />}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ACTIVE / CALLING OVERLAY */}
//       {callState !== "incoming" && (
//         <div className="absolute inset-0 z-40 bg-zinc-950 flex flex-col animate-in fade-in">
//           <div className="p-6 flex justify-between items-center bg-black/50 absolute top-0 w-full z-10">
//             <h2 className="text-xl font-bold">
//               {callState === "calling" ? "Ringing..." : `In Call with ${callData?.callerName}`}
//             </h2>
//             <div className="flex items-center gap-2">
//               <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
//               <span className="text-green-500 text-xs font-bold uppercase tracking-widest">
//                 {callData?.type === "video" ? "Secure Video" : "Secure Audio"}
//               </span>
//             </div>
//           </div>

//           <div className="flex-1 relative flex items-center justify-center">
//             {callData?.type === "video" ? (
//               <>
//                 <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
//                 <div className="absolute bottom-24 right-6 w-32 h-48 bg-zinc-800 rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl">
//                   <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
//                 </div>
//               </>
//             ) : (
//               <div className="flex flex-col items-center">
//                 <div className="w-32 h-32 bg-zinc-800 rounded-full flex items-center justify-center border-4 border-violet-500/30 animate-pulse">
//                   <UserCircle size={64} className="text-zinc-600" />
//                 </div>
//                 <audio ref={remoteVideoRef} autoPlay />
//               </div>
//             )}
//           </div>

//           <div className="p-8 bg-gradient-to-t from-black to-transparent flex justify-center absolute bottom-0 w-full gap-6">
//             <button 
//               onClick={toggleMic} 
//               className={`p-6 rounded-full transition-transform hover:scale-105 ${isMicMuted ? "bg-zinc-200 text-red-600" : "bg-zinc-800 hover:bg-zinc-700 text-white"}`}
//             >
//               {isMicMuted ? <MicOff size={32} /> : <Mic size={32} />}
//             </button>

//             {/* 🔥 Use cancelCall if ringing, else use endCall */}
//             <button 
//               onClick={callState === "calling" ? cancelCall : endCall} 
//               className="p-6 bg-red-600 hover:bg-red-700 rounded-full shadow-[0_0_30px_rgba(220,38,38,0.5)] transition-transform hover:scale-105"
//             >
//               <PhoneOff size={32} />
//             </button>
//           </div>
//         </div>
//       )}
//     </>
//   );
// }