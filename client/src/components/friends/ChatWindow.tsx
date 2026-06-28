"use client";

import { useEffect } from "react";
import {
  ArrowLeft,
  Phone,
  Video,
  Send,
  MessageSquare,
  Clock,
  Check,
  CheckCheck,
  ChevronUp,
  MoreVertical,
  UserCircle,
} from "lucide-react";
import { Friend } from "@/hooks/useFriends";
import { Message } from "@/hooks/useFriendChat";

type ChatWindowProps = {
  user: any;
  activeFriend: Friend | null;
  setActiveFriend: (f: Friend | null) => void;
  onlineUsers: Set<string>;
  typingUsers: Set<string>;
  chatHistories: Record<string, Message[]>;
  hasMoreMessages: Record<string, boolean>;
  loadOlderMessages: () => void;
  newMessage: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSendMessage: (e: React.FormEvent) => void;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
  initiateCall: (type: "video" | "voice") => void;
};

// ── Helpers ───────────────────────────────────────────────────────
const formatTime = (d: string | Date) =>
  new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(d));

const formatDateLabel = (d: string | Date) => {
  const date = new Date(d);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

function StatusIcon({ status }: { status?: Message["status"] }) {
  if (status === "PENDING")
    return <Clock size={11} className="text-zinc-600 animate-pulse" />;
  if (status === "SENT") return <Check size={12} className="text-zinc-500" />;
  if (status === "DELIVERED")
    return <CheckCheck size={12} className="text-zinc-400" />;
  if (status === "READ")
    return <CheckCheck size={12} className="text-violet-400" />;
  return null;
}

export default function ChatWindow({
  user,
  activeFriend,
  setActiveFriend,
  onlineUsers,
  typingUsers,
  chatHistories,
  hasMoreMessages,
  loadOlderMessages,
  newMessage,
  handleInputChange,
  handleSendMessage,
  chatEndRef,
  initiateCall,
}: ChatWindowProps) {
  const currentMessages = activeFriend
    ? chatHistories[activeFriend.friendshipId] || []
    : [];
  const isFriendOnline = activeFriend
    ? onlineUsers.has(activeFriend.id)
    : false;
  const isFriendTyping = activeFriend
    ? typingUsers.has(activeFriend.id)
    : false;
  const friendName =
    activeFriend?.username ?? activeFriend?.firstName ?? "Unknown User";

  // Auto-scroll logic
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [currentMessages, isFriendTyping, chatEndRef]);

  // Group messages by date
  const grouped: { label: string; msgs: Message[] }[] = [];
  currentMessages.forEach((msg) => {
    const label = formatDateLabel(msg.sentAt);
    const last = grouped[grouped.length - 1];
    if (last?.label === label) last.msgs.push(msg);
    else grouped.push({ label, msgs: [msg] });
  });

  // ── Empty State (No friend selected) ───────────────────────────
  if (!activeFriend) {
    return (
      <div className="flex-1 hidden md:flex flex-col items-center justify-center text-center gap-5 px-8 z-10 bg-[#050507] relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/5 blur-[140px] rounded-full pointer-events-none" />
        <div className="w-20 h-20 bg-white/[0.03] border border-white/[0.06] rounded-3xl flex items-center justify-center animate-in zoom-in duration-500">
          <MessageSquare size={34} className="text-zinc-700" />
        </div>
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <h3 className="text-xl font-bold text-zinc-300 mb-1.5 tracking-tight">
            Your Messages
          </h3>
          <p className="text-zinc-600 text-sm leading-relaxed max-w-xs">
            Select a friend from the sidebar to pick up where you left off or
            start a new conversation.
          </p>
        </div>
      </div>
    );
  }

  // ── Active Chat State ──────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-[#050507]">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/5 blur-[140px] rounded-full pointer-events-none" />

      {/* ── Header ── */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-white/[0.06] bg-[#08080b]/80 backdrop-blur-xl z-20">
        <div className="flex items-center gap-3 md:gap-4">
          <button
            onClick={() => setActiveFriend(null)}
            className="md:hidden p-2 -ml-1 text-zinc-500 hover:text-white hover:bg-white/[0.06] rounded-xl transition-all"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="relative">
            {activeFriend.imageUrl ? (
              <img
                src={activeFriend.imageUrl}
                alt="Avatar"
                className="w-10 h-10 rounded-full object-cover border border-white/10"
              />
            ) : (
              <UserCircle className="w-10 h-10 text-zinc-600" />
            )}
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-[#08080b] ${isFriendOnline ? "bg-emerald-400" : "bg-zinc-600"}`}
            />
          </div>

          <div>
            <h3 className="font-bold text-sm md:text-base text-white leading-tight">
              {friendName}
            </h3>
            <p
              className={`text-xs mt-0.5 flex items-center gap-1.5 leading-none ${isFriendTyping ? "text-violet-400" : isFriendOnline ? "text-emerald-500" : "text-zinc-600"}`}
            >
              {isFriendTyping ? (
                <>
                  <span className="flex gap-0.5 items-center">
                    {[0, 80, 160].map((d) => (
                      <span
                        key={d}
                        className="w-1 h-1 bg-violet-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${d}ms` }}
                      />
                    ))}
                  </span>
                  typing…
                </>
              ) : (
                <>{isFriendOnline ? "Online" : "Offline"}</>
              )}
            </p>
          </div>
        </div>

        {/* Call Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => initiateCall("voice")}
            disabled={!isFriendOnline}
            title="Voice call"
            className="w-10 h-10 flex items-center justify-center rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            <Phone size={18} />
          </button>
          <button
            onClick={() => initiateCall("video")}
            disabled={!isFriendOnline}
            title="Video call"
            className="w-10 h-10 flex items-center justify-center rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            <Video size={18} />
          </button>
        </div>
      </div>

      {/* ── Messages Area ── */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-6 z-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* Load Older */}
        {hasMoreMessages[activeFriend.friendshipId] && (
          <div className="flex justify-center mb-4">
            <button
              onClick={loadOlderMessages}
              className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] px-5 py-2.5 rounded-full transition-all"
            >
              <ChevronUp size={14} /> Load older messages
            </button>
          </div>
        )}

        {/* Empty Chat */}
        {currentMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-3">
            <MessageSquare size={42} className="text-zinc-800 mb-2" />
            <p className="text-zinc-400 font-semibold text-sm">
              Start the conversation
            </p>
            <p className="text-zinc-600 text-xs">Say hi to {friendName} 👋</p>
          </div>
        ) : (
          grouped.map(({ label, msgs }) => (
            <div key={label} className="space-y-4">
              {/* Date Separator */}
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-[#050507] px-2">
                  {label}
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
              </div>

              {/* Message Bubbles */}
              {msgs.map((msg, idx) => {
                const isMe = msg.senderId === user?.id;
                const prevMsg = msgs[idx - 1];
                const isSameGroup =
                  prevMsg && prevMsg.senderId === msg.senderId;

                return (
                  <div
                    key={msg.id ?? msg.tempId ?? `${label}-${idx}`}
                    className={`flex items-end gap-2.5 ${isMe ? "flex-row-reverse" : "flex-row"} ${isSameGroup ? "mt-1" : "mt-4"}`}
                  >
                    <div
                      className={`flex flex-col gap-1 max-w-[80%] md:max-w-[65%] ${isMe ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`px-5 py-3 rounded-2xl text-[14px] leading-relaxed break-words shadow-sm ${
                          isMe
                            ? "bg-violet-600 text-white rounded-br-[6px] shadow-[0_4px_20px_-6px_rgba(124,58,237,0.3)]"
                            : "bg-white/[0.06] border border-white/[0.08] text-zinc-200 rounded-bl-[6px]"
                        }`}
                      >
                        {msg.content}
                      </div>

                      {/* Time + Status */}
                      <div
                        className={`flex items-center gap-1.5 px-1 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                      >
                        <span className="text-[10px] font-medium text-zinc-500 tracking-wide">
                          {formatTime(msg.sentAt)}
                        </span>
                        {isMe && <StatusIcon status={msg.status} />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}

        {/* Typing Indicator */}
        {isFriendTyping && (
          <div className="flex items-end gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white/[0.06] border border-white/[0.08] px-5 py-4 rounded-2xl rounded-bl-[6px] flex gap-1.5 items-center">
              {[0, 150, 300].map((d) => (
                <span
                  key={d}
                  className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${d}ms` }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* ── Input Area ── */}
      <div className="flex-shrink-0 p-4 border-t border-white/[0.06] bg-[#08080b]/90 backdrop-blur-2xl z-20">
        <form
          onSubmit={handleSendMessage}
          className="flex items-center gap-3 max-w-5xl mx-auto"
        >
          <div className="flex-1 relative group">
            <input
              type="text"
              value={newMessage}
              onChange={handleInputChange}
              placeholder={`Message ${friendName}…`}
              className="w-full bg-white/[0.04] border border-white/[0.08] group-focus-within:border-violet-500/50 rounded-2xl px-5 py-3.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-4 focus:ring-violet-500/10 transition-all duration-300"
            />
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="w-12 h-12 flex-shrink-0 bg-violet-600 hover:bg-violet-500 disabled:bg-white/[0.05] disabled:text-zinc-600 text-white rounded-2xl transition-all duration-200 active:scale-95 disabled:cursor-not-allowed flex items-center justify-center shadow-[0_0_24px_-6px_rgba(124,58,237,0.5)] disabled:shadow-none group"
          >
            <Send
              size={18}
              className="group-disabled:opacity-50 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
            />
          </button>
        </form>
      </div>
    </div>
  );
}

// import { useEffect } from "react";
// import { Send, UserCircle, MessageSquare, ArrowLeft, Clock, Check, CheckCheck, Video, Phone } from "lucide-react";
// import { Friend } from "@/hooks/useFriends";
// import { Message } from "@/hooks/useFriendChat";

// type ChatWindowProps = {
//   user: any;
//   activeFriend: Friend | null;
//   setActiveFriend: (f: Friend | null) => void;
//   onlineUsers: Set<string>;
//   typingUsers: Set<string>;
//   chatHistories: Record<string, Message[]>;
//   hasMoreMessages: Record<string, boolean>;
//   loadOlderMessages: () => void;
//   newMessage: string;
//   handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
//   handleSendMessage: (e: React.FormEvent) => void;
//   chatEndRef: React.RefObject<HTMLDivElement | null>;
//   initiateCall: (type: "video" | "voice") => void;
// };

// const formatTime = (dateInput: string | Date) => {
//   return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(dateInput));
// };

// export default function ChatWindow({
//   user, activeFriend, setActiveFriend, onlineUsers, typingUsers, chatHistories, hasMoreMessages, loadOlderMessages, newMessage, handleInputChange, handleSendMessage, chatEndRef, initiateCall
// }: ChatWindowProps) {

//   const currentMessages = activeFriend ? (chatHistories[activeFriend.friendshipId] || []) : [];
//   const isFriendOnline = activeFriend ? onlineUsers.has(activeFriend.id) : false;
//   const isFriendTyping = activeFriend ? typingUsers.has(activeFriend.id) : false;

//   // 🔥 FIX 1: Auto-scroll to the bottom whenever messages or typing status change
//   useEffect(() => {
//     chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [currentMessages, isFriendTyping, chatEndRef]);

//   if (!activeFriend) {
//     return (
//       <div className="flex-1 hidden md:flex flex-col items-center justify-center text-zinc-600 z-10 bg-black relative">
//         <MessageSquare size={64} className="mb-6 opacity-20" />
//         <h3 className="text-xl font-bold text-zinc-400">Your Messages</h3>
//         <p className="mt-2">Select a friend from the sidebar to start chatting.</p>
//       </div>
//     );
//   }

//   return (
//     <div className="flex-1 flex flex-col bg-black relative overflow-hidden">
//       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/5 blur-[120px] rounded-full pointer-events-none" />

//       {/* Header */}
//       <div className="p-4 md:p-6 border-b border-white/10 flex items-center gap-3 md:gap-4 bg-zinc-950/50 backdrop-blur-md z-10 justify-between">
//         <div className="flex items-center gap-3 md:gap-4">
//           <button onClick={() => setActiveFriend(null)} className="md:hidden p-2 -ml-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-colors">
//             <ArrowLeft size={22} />
//           </button>
//           {activeFriend.imageUrl ? (
//             <img src={activeFriend.imageUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-white/10" />
//           ) : (
//             <UserCircle className="w-10 h-10 text-gray-500" />
//           )}
//           <div>
//             <h3 className="font-bold text-base md:text-lg">{activeFriend.username || activeFriend.firstName || "Unknown User"}</h3>
//             <p className={`text-xs flex items-center gap-1 ${isFriendOnline ? "text-green-400" : "text-gray-500"}`}>
//               <span className={`w-2 h-2 rounded-full ${isFriendOnline ? "bg-green-500" : "bg-gray-500"}`}></span>
//               {isFriendOnline ? "Online" : "Offline"}
//             </p>
//           </div>
//         </div>

//         {/* Call Buttons */}
//         <div className="flex items-center gap-2">
//           <button onClick={() => initiateCall("voice")} disabled={!isFriendOnline} className="p-2.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full disabled:opacity-30 disabled:hover:bg-transparent">
//             <Phone size={20} />
//           </button>
//           <button onClick={() => initiateCall("video")} disabled={!isFriendOnline} className="p-2.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full disabled:opacity-30 disabled:hover:bg-transparent">
//             <Video size={20} />
//           </button>
//         </div>
//       </div>

//       {/* Chat Messages */}
//       {/* 🔥 FIX 2: Added Tailwind classes to completely hide the scrollbar but keep scroll functionality */}
//       <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 z-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
//         {hasMoreMessages[activeFriend.friendshipId] && (
//           <div className="text-center mb-4">
//             <button onClick={loadOlderMessages} className="text-xs bg-zinc-900 border border-white/10 px-4 py-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
//               Load older messages
//             </button>
//           </div>
//         )}

//         {currentMessages.length === 0 ? (
//           <div className="h-full flex flex-col items-center justify-center text-gray-500">
//             <MessageSquare size={48} className="mb-4 opacity-20" />
//             <p>No messages yet. Send a wave! 👋</p>
//           </div>
//         ) : (
//           currentMessages.map((msg, idx) => {
//             const isMe = msg.senderId === user?.id;
//             return (
//               <div key={idx} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
//                 <div className={`max-w-[85%] md:max-w-[70%] px-4 md:px-5 py-3 rounded-2xl text-sm shadow-xl ${isMe ? "bg-violet-600 text-white rounded-br-none" : "bg-zinc-800 text-gray-200 rounded-bl-none border border-white/5"}`}>
//                   {msg.content}
//                 </div>
//                 <div className="flex items-center gap-1 mt-1 px-1 justify-end">
//                   <span className="text-[10px] text-gray-500">{formatTime(msg.sentAt)}</span>
//                   {isMe && (
//                     <span className="ml-1">
//                       {msg.status === "PENDING" && <Clock size={12} className="text-gray-500 animate-pulse" />}
//                       {msg.status === "SENT" && <Check size={14} className="text-gray-400" />}
//                       {msg.status === "DELIVERED" && <CheckCheck size={14} className="text-gray-400" />}
//                       {msg.status === "READ" && <CheckCheck size={14} className="text-blue-400" />}
//                     </span>
//                   )}
//                 </div>
//               </div>
//             );
//           })
//         )}

//         {/* Typing Indicator */}
//         {isFriendTyping && (
//           <div className="flex justify-start">
//             <div className="bg-zinc-800 px-4 py-3 rounded-2xl rounded-bl-none flex items-center gap-1 w-16 h-10">
//               <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
//               <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
//               <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
//             </div>
//           </div>
//         )}
//         <div ref={chatEndRef} />
//       </div>

//       {/* Input */}
//       <div className="p-3 md:p-4 border-t border-white/10 bg-zinc-950 z-10 pb-6 md:pb-4">
//         <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-center gap-2 md:gap-3">
//           <input
//             type="text"
//             value={newMessage}
//             onChange={handleInputChange}
//             placeholder={`Message ${activeFriend.firstName || "friend"}...`}
//             className="flex-1 bg-zinc-900 border border-white/10 rounded-full px-4 md:px-6 py-2.5 md:py-3 text-white focus:outline-none focus:border-violet-500 transition-colors text-sm md:text-base"
//           />
//           <button type="submit" disabled={!newMessage.trim()} className="p-2.5 md:p-3 bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-full transition-all shadow-[0_0_15px_rgba(124,58,237,0.3)] disabled:shadow-none">
//             <Send size={18} />
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }
