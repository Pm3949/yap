"use client";

import { Check, X } from "lucide-react";

interface KnockModalProps {
  knockerId: string;
  onAccept: () => void;
  onDeny: () => void;
}

export default function KnockModal({ knockerId, onAccept, onDeny }: KnockModalProps) {
  return (
    <div className="absolute top-20 right-4 w-72 bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-right-4">
      <div className="flex flex-col">
        <h3 className="text-white font-bold text-sm mb-1">Someone is knocking!</h3>
        <p className="text-slate-400 text-xs mb-4">A user wants to join your campfire.</p>
        
        <div className="flex gap-2 w-full">
          <button 
            onClick={onAccept}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg py-2 flex items-center justify-center gap-1 transition-colors"
          >
            <Check className="w-4 h-4" />
            <span className="text-sm font-medium">Let in</span>
          </button>
          <button 
            onClick={onDeny}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg py-2 flex items-center justify-center gap-1 transition-colors"
          >
            <X className="w-4 h-4" />
            <span className="text-sm font-medium">Ignore</span>
          </button>
        </div>
      </div>
    </div>
  );
}
