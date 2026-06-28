"use client";

import { useState, useEffect, useRef } from "react";
import { Send, LogOut } from "lucide-react";
import { Socket } from "socket.io-client";

interface MapChatRoomProps {
  socket: Socket;
  roomId: string;
  myAlias: string;
  onLeave: () => void;
}

export default function MapChatRoom({ socket, roomId, myAlias, onLeave }: MapChatRoomProps) {
  const [messages, setMessages] = useState<{sender: string, message: string, timestamp: number}[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMsg = (data: any) => setMessages(prev => [...prev, data]);
    const handleJoin = (data: any) => setMessages(prev => [...prev, { sender: "System", message: data.message, timestamp: Date.now() }]);
    
    socket.on("receiveMapMessage", handleMsg);
    socket.on("userJoinedMapRoom", handleJoin);

    return () => {
      socket.off("receiveMapMessage", handleMsg);
      socket.off("userJoinedMapRoom", handleJoin);
    };
  }, [socket]);

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
    socket.emit("leaveMapRoom");
    onLeave();
  };

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-lg bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-40 transition-all duration-300" style={{ height: '400px' }}>
      {/* Header */}
      <div className="bg-slate-800/80 px-4 py-3 flex justify-between items-center border-b border-slate-700/50">
        <div>
          <h3 className="font-bold text-white text-sm">Ephemeral Campfire</h3>
          <p className="text-xs text-emerald-400">You are {myAlias}</p>
        </div>
        <button 
          onClick={leaveRoom}
          className="text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1 text-xs font-medium bg-slate-800 px-3 py-1.5 rounded-full"
        >
          <LogOut className="w-3 h-3" />
          Leave & Forget
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        <div className="text-center my-2">
          <span className="text-xs text-slate-500 bg-slate-800/50 px-3 py-1 rounded-full">
            Room history is deleted when the last person leaves.
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
