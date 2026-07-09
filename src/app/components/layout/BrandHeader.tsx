import React from "react";
import { Sparkles } from "lucide-react";

interface BrandHeaderProps {
  onClick?: () => void;
}

export default function BrandHeader({ onClick }: BrandHeaderProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-lg text-left transition-opacity hover:opacity-85"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-white shadow-sm">
        <Sparkles size={19} className="text-accent" />
      </div>
      <div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-primary">모</span>
          <span className="text-2xl font-black text-accent">잇</span>
          <span className="ml-1 text-xs font-black tracking-widest text-muted-foreground">MOIT</span>
        </div>
        <p className="text-xs font-bold text-muted-foreground">돈값을 같이 따져보는 AI 코치</p>
      </div>
    </button>
  );
}
