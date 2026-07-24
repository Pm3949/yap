"use client";

import { useState, useEffect, useRef } from "react";
import { Send, LogOut, Users, ShieldAlert, X } from "lucide-react";
import { Socket } from "socket.io-client";

interface MapChatRoomProps {
  socket: Socket;
  roomId: string;
  myAlias: string;
  isPrivate: boolean;
  onLeave: () => void;
}

interface Member {
  socketId: string;
  alias: string;
  isCreator: boolean;
}

export default function MapChatRoom({ socket, roomId, myAlias, isPrivate, onLeave }: MapChatRoomProps) {
  const [messages, setMessages] = useState<{sender: string, message: string, timestamp: number}[]>([]);
  const [input, setInput] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [showMembers, setShowMembers] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMsg = (data: any) => setMessages(prev => [...prev, data]);
    const handleJoin = (data: any) => setMessages(prev => [...prev, { sender: "System", message: data.message, timestamp: Date.now() }]);
    const handleMembers = (data: { roomId: string, members: Member[] }) => {
      if (data.roomId === roomId) {
        setMembers(data.members);
      }
    };
    
    socket.on("receiveMapMessage", handleMsg);
    socket.on("userJoinedMapRoom", handleJoin);
    socket.on("roomMembersUpdate", handleMembers);

    // Request members list on mount
    socket.emit("requestRoomMembers", { roomId });

    return () => {
      socket.off("receiveMapMessage", handleMsg);
      socket.off("userJoinedMapRoom", handleJoin);
      socket.off("roomMembersUpdate", handleMembers);
    };
  }, [socket, roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    socket.emit("sendMapMessage", { roomId, message: input });
    setInput("");
  };

  const leaveRoom = () => {
    socket.emit("leaveMapRoom", { roomId });
    onLeave();
  };

  const kickUser = (targetSocketId: string) => {
    socket.emit("kickUser", { roomId, targetSocketId });
  };

  const myMember = members.find(m => m.socketId === socket.id);
  const isRoomCreator = myMember?.isCreator;

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-lg bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-40 transition-all duration-300 relative" style={{ height: '400px' }}>
      {/* Header */}
      <div className="bg-slate-800/80 px-4 py-3 flex justify-between items-center border-b border-slate-700/50">
        <div>
          <h3 className="font-bold text-white text-sm">Campfire Room</h3>
          <p className="text-xs text-emerald-400">You are {myAlias} {isRoomCreator && "(Creator)"}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMembers(!showMembers)}
            className={`p-1.5 rounded-full transition-colors relative ${showMembers ? 'bg-orange-500/20 text-orange-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            title="Room Members"
          >
            <Users className="w-4 h-4" />
            {members.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {members.length}
              </span>
            )}
          </button>
          <button 
            onClick={leaveRoom}
            className="text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1 text-xs font-medium bg-slate-800 px-3 py-1.5 rounded-full"
          >
            <LogOut className="w-3 h-3" />
            Leave
          </button>
        </div>
      </div>

      {/* Members overlay list */}
      {showMembers && (
        <div className="absolute inset-x-0 top-[53px] bottom-0 bg-slate-950/95 backdrop-blur-md z-50 p-4 flex flex-col transition-all duration-300">
          <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
            <h4 className="font-bold text-sm text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-500" />
              Campfire Members ({members.length})
            </h4>
            <button onClick={() => setShowMembers(false)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2">
            {members.map((m) => (
              <div key={m.socketId} className="flex justify-between items-center p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-zinc-300">
                    {m.alias} {m.socketId === socket.id && "(You)"}
                  </span>
                  {m.isCreator && (
                    <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded font-semibold border border-orange-500/30">
                      Creator
                    </span>
                  )}
                </div>
                {isRoomCreator && !m.isCreator && isPrivate && (
                  <button
                    onClick={() => kickUser(m.socketId)}
                    className="text-xs bg-red-950/40 border border-red-900 hover:bg-red-900/60 text-red-400 hover:text-white px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
                  >
                    <ShieldAlert className="w-3 h-3" />
                    Kick
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        <div className="text-center my-2">
          <span className="text-xs text-slate-500 bg-slate-800/50 px-3 py-1 rounded-full">
            {isPrivate ? "Private Room: Invitation only." : "Public Room: Anyone can join."}
          </span>
        </div>
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.sender === myAlias ? 'items-end' : m.sender === 'System' ? 'items-center' : 'items-start'}`}>
            {m.sender !== 'System' && m.sender !== myAlias && (
              <span className="text-[10px] text-slate-400 mb-1 ml-1">{m.sender}</span>
            )}
            <div className={`
              px-4 py-2 rounded-2xl max-w-[85%] text-sm
              ${m.sender === 'System' ? 'bg-slate-800/50 text-slate-400 text-xs italic px-3 py-1 rounded-full' : 
                m.sender === myAlias ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-700 text-slate-200 rounded-bl-none'}
            `}>
              {m.message}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-3 bg-slate-800/50 border-t border-slate-700/50 flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Say something..." 
          className="flex-1 bg-slate-900 border border-slate-700 rounded-full px-4 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
        />
        <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-full transition-colors flex-shrink-0">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
