"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, MessageSquare, Users, ChevronDown, ArrowLeft } from "lucide-react";
import { Friend } from "@/hooks/useFriends";

type SidebarProps = {
  friends: Friend[];
  activeFriend: Friend | null;
  setActiveFriend: (friend: Friend | null) => void;
  onlineUsers: Set<string>;
  typingUsers: Set<string>;
  unreadCounts: Record<string, number>;
};

// ── Helper: Avatar ────────────────────────────────────────────────
function Avatar({ src, name, size = "md" }: { src?: string; name?: string; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "w-8 h-8 text-xs" : "w-11 h-11 text-sm";
  const seed = name?.slice(0, 2).toUpperCase() ?? "?";
  if (src) return (
    <img src={src} alt={name ?? ""} className={`${dim} rounded-full object-cover flex-shrink-0 border border-white/10`} />
  );
  return (
    <div className={`${dim} rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center font-bold text-white flex-shrink-0 shadow-inner`}>
      {seed}
    </div>
  );
}

export default function Sidebar({
  friends, activeFriend, setActiveFriend,
  onlineUsers, typingUsers, unreadCounts,
}: SidebarProps) {
  const [query, setQuery] = useState("");

  const onlineFriends  = friends.filter(f => onlineUsers.has(f.id));
  const offlineFriends = friends.filter(f => !onlineUsers.has(f.id));

  const filtered = (list: Friend[]) =>
    query
      ? list.filter(f => (f.username ?? f.firstName ?? "").toLowerCase().includes(query.toLowerCase()))
      : list;

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  return (
    <aside className={`${activeFriend ? "hidden md:flex" : "flex"} w-full md:w-[320px] lg:w-[360px] flex-shrink-0 flex-col border-r border-white/[0.06] bg-[#050507] relative z-10 h-full`}>

      {/* ── Top Header ────────────────────────── */}
      <div className="px-5 pt-6 pb-4 border-b border-white/[0.06] bg-[#08080b]/50 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
              <MessageSquare size={16} className="text-violet-400" />
            </div>
            <h2 className="text-xl font-black tracking-tight text-white">Chats</h2>
          </div>
          
          <div className="flex items-center gap-2">
            {totalUnread > 0 && (
              <span className="px-2 py-0.5 bg-violet-600 shadow-[0_0_12px_-3px_rgba(124,58,237,0.8)] text-white text-[10px] font-bold rounded-full leading-tight animate-in zoom-in duration-300">
                {totalUnread} New
              </span>
            )}
            <Link
              href="/"
              className="w-8 h-8 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] flex items-center justify-center text-zinc-500 hover:text-white transition-all active:scale-95"
              title="Back to Home"
            >
              <ArrowLeft size={15} />
            </Link>
          </div>
        </div>

        {/* ── Search Bar ── */}
        <div className="relative group">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-violet-400 transition-colors" />
          <input
            type="text"
            placeholder="Search friends…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/[0.08] group-focus-within:border-violet-500/50 group-focus-within:bg-violet-500/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-4 focus:ring-violet-500/10 transition-all duration-300"
          />
        </div>
      </div>

      {/* ── Friend List Area ───────────────────── */}
      {/* 🔥 FIX: Changed px-3 to px-5 so list items align perfectly with Search bar & stop clipping */}
      <div className="flex-1 overflow-y-auto py-5 px-5 space-y-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

        {friends.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center h-full text-center px-4 animate-in fade-in duration-500 pb-10">
            <div className="w-16 h-16 bg-white/[0.02] border border-white/[0.06] rounded-3xl flex items-center justify-center mb-4 shadow-inner">
              <Users size={28} className="text-zinc-700" />
            </div>
            <p className="text-zinc-300 text-sm font-bold mb-1.5 tracking-tight">Your friends list is empty!</p>
            <p className="text-zinc-600 text-xs leading-relaxed mb-6">
              Survive the 2-minute timer in Chaos Mode to add people here.
            </p>
            <Link
              href="/text-chat"
              className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl transition-all active:scale-95 shadow-[0_0_20px_-5px_rgba(124,58,237,0.5)]"
            >
              Enter Chaos Mode
            </Link>
          </div>
        ) : (
          <>
            {/* Online Group */}
            {filtered(onlineFriends).length > 0 && (
              <FriendGroup label="Online" count={filtered(onlineFriends).length} dot="bg-emerald-400">
                {filtered(onlineFriends).map(f => (
                  <FriendRow
                    key={f.id} friend={f}
                    isActive={activeFriend?.id === f.id}
                    isOnline={true}
                    isTyping={typingUsers.has(f.id)}
                    unread={unreadCounts[f.friendshipId] ?? 0}
                    onClick={() => setActiveFriend(f)}
                  />
                ))}
              </FriendGroup>
            )}

            {/* Offline Group */}
            {filtered(offlineFriends).length > 0 && (
              <FriendGroup label="Offline" count={filtered(offlineFriends).length} dot="bg-zinc-600">
                {filtered(offlineFriends).map(f => (
                  <FriendRow
                    key={f.id} friend={f}
                    isActive={activeFriend?.id === f.id}
                    isOnline={false}
                    isTyping={false}
                    unread={unreadCounts[f.friendshipId] ?? 0}
                    onClick={() => setActiveFriend(f)}
                  />
                ))}
              </FriendGroup>
            )}

            {/* No Search Results */}
            {query && filtered(onlineFriends).length === 0 && filtered(offlineFriends).length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in">
                <Search size={24} className="text-zinc-700 mb-2" />
                <p className="text-zinc-500 text-sm">No friends found for <span className="text-zinc-300 font-semibold">"{query}"</span></p>
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}

// ── Component: FriendGroup ─────────────────────────────────────────
function FriendGroup({ label, count, dot, children }: { label: string; count: number; dot: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2.5 px-2 mb-3 group outline-none"
      >
        <span className={`w-1.5 h-1.5 rounded-full ${dot} flex-shrink-0 shadow-sm`} />
        <span className="text-[10px] font-black tracking-widest uppercase text-zinc-500 group-hover:text-zinc-400 transition-colors flex-1 text-left">
          {label} · {count}
        </span>
        <ChevronDown
          size={14}
          className={`text-zinc-600 transition-transform duration-300 ${open ? "" : "-rotate-90"}`}
        />
      </button>
      {/* Smooth height transition placeholder */}
      <div className={`space-y-1.5 transition-all duration-300 overflow-hidden ${open ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"}`}>
        {children}
      </div>
    </div>
  );
}

// ── Component: FriendRow ──────────────────────────────────────────
function FriendRow({
  friend, isActive, isOnline, isTyping, unread, onClick,
}: {
  friend: Friend; isActive: boolean; isOnline: boolean; isTyping: boolean; unread: number; onClick: () => void;
}) {
  const name = friend.username ?? friend.firstName ?? "Unknown";

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-[20px] transition-all duration-200 text-left group outline-none ${
        isActive
          ? "bg-violet-600/15 border border-violet-500/30 shadow-[0_0_20px_-5px_rgba(124,58,237,0.3)]"
          : "bg-transparent hover:bg-white/[0.04] border border-transparent"
      }`}
    >
      {/* Avatar with Status Dot */}
      <div className="relative flex-shrink-0">
        <Avatar src={friend.imageUrl} name={name} />
        <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-[2.5px] border-[#050507] transition-colors ${
          isOnline ? "bg-emerald-400" : "bg-zinc-600"
        }`} />
      </div>

      {/* Name & Status Text */}
      <div className="flex-1 min-w-0">
        <p className={`text-[14px] font-bold truncate leading-tight transition-colors ${
          isActive ? "text-white" : "text-zinc-300 group-hover:text-white"
        }`}>
          {name}
        </p>
        <div className="text-[11px] font-medium truncate mt-1 leading-tight">
          {isTyping ? (
            <span className="text-violet-400 flex items-center gap-1">
              <span className="flex gap-0.5">
                {[0, 150, 300].map(d => (
                  <span key={d} className="w-1 h-1 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </span>
              typing…
            </span>
          ) : (
            <span className={isOnline ? "text-emerald-500/80" : "text-zinc-600"}>
              {isActive && !isOnline ? "Tap to chat..." : isOnline ? "Active now" : "Offline"}
            </span>
          )}
        </div>
      </div>

      {/* Unread Badge */}
      {unread > 0 && (
        <span className="w-5 h-5 bg-violet-600 text-white text-[10px] font-black rounded-full flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_-2px_rgba(124,58,237,0.8)] animate-in zoom-in duration-200">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </button>
  );
}



// import { Search, UserCircle, MessageSquare, ArrowLeft, Users } from "lucide-react";
// import Link from "next/link";
// import { Friend } from "@/hooks/useFriends";

// type SidebarProps = {
//   friends: Friend[];
//   activeFriend: Friend | null;
//   setActiveFriend: (friend: Friend | null) => void;
//   onlineUsers: Set<string>;
//   typingUsers: Set<string>;
//   unreadCounts: Record<string, number>;
// };

// export default function Sidebar({ friends, activeFriend, setActiveFriend, onlineUsers, typingUsers, unreadCounts }: SidebarProps) {
//   return (
//     <div className={`${activeFriend ? "hidden md:flex" : "flex"} w-full md:w-80 lg:w-96 border-r border-white/10 flex-col bg-zinc-950`}>
//       <div className="p-4 md:p-6 border-b border-white/10 flex items-center justify-between">
//         <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
//           <MessageSquare className="text-violet-500" /> Chats
//         </h2>
//         <Link href="/" className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-400 hover:text-white">
//           <ArrowLeft size={20} />
//         </Link>
//       </div>

//       <div className="p-4">
//         <div className="relative">
//           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
//           <input
//             type="text"
//             placeholder="Search friends..."
//             className="w-full bg-zinc-900 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-violet-500 transition-colors"
//           />
//         </div>
//       </div>

//       <div className="flex-1 overflow-y-auto">
//         {friends.length === 0 ? (
//           <div className="p-6 text-center flex flex-col items-center justify-center h-full text-zinc-500 animate-in fade-in">
//             <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4">
//               <Users size={24} className="text-zinc-600" />
//             </div>
//             <p className="text-sm mb-4">
//               Your friends list is empty! <br/> Survive the 2-minute timer in Chaos Mode to add people here.
//             </p>
//             <Link href="/yap" className="px-6 py-2 bg-violet-600/20 text-violet-400 hover:bg-violet-600 hover:text-white rounded-full transition-colors text-sm font-bold">
//               Enter Chaos Mode
//             </Link>
//           </div>
//         ) : (
//           friends.map((friend) => {
//             const unread = unreadCounts[friend.friendshipId] || 0;
//             const isOnline = onlineUsers.has(friend.id);

//             return (
//               <button
//                 key={friend.id}
//                 onClick={() => setActiveFriend(friend)}
//                 className={`w-full p-4 flex items-center gap-4 text-left transition-colors border-b border-white/5 ${
//                   activeFriend?.id === friend.id ? "bg-violet-600/10 border-l-4 border-l-violet-500" : "hover:bg-zinc-900"
//                 }`}
//               >
//                 <div className="relative">
//                   {friend.imageUrl ? (
//                     <img src={friend.imageUrl} alt="Avatar" className="w-12 h-12 rounded-full object-cover border border-white/10" />
//                   ) : (
//                     <UserCircle className="w-12 h-12 text-gray-500" />
//                   )}
//                   <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-zinc-950 rounded-full ${isOnline ? "bg-green-500" : "bg-gray-500"}`}></span>
//                 </div>

//                 <div className="flex-1 overflow-hidden">
//                   <h3 className="font-bold truncate text-gray-200">{friend.username || friend.firstName || "Unknown User"}</h3>
//                   <p className="text-xs text-gray-500 truncate">
//                     {typingUsers.has(friend.id) ? <span className="text-violet-400 italic">typing...</span> : "Tap to chat..."}
//                   </p>
//                 </div>

//                 {unread > 0 && <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">{unread}</div>}
//               </button>
//             );
//           })
//         )}
//       </div>
//     </div>
//   );
// }