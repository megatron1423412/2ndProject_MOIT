import React from "react";
import { Bell, LogIn, LogOut, Moon, Star, Sun } from "lucide-react";

interface TopActionBarProps {
  isLoggedIn: boolean;
  isDarkMode: boolean;
  isFavorite: boolean;
  onToggleLogin: () => void;
  onToggleTheme: () => void;
  onToggleFavorite: () => void;
}

export default function TopActionBar({
  isLoggedIn,
  isDarkMode,
  isFavorite,
  onToggleLogin,
  onToggleTheme,
  onToggleFavorite,
}: TopActionBarProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        title="알림"
        className="h-10 w-10 rounded-lg border border-border bg-card text-primary shadow-sm transition-all hover:border-accent/40 hover:bg-secondary active:scale-[0.98] flex items-center justify-center"
      >
        <Bell size={18} />
      </button>
      <button
        type="button"
        title={isLoggedIn ? "로그아웃" : "로그인"}
        onClick={onToggleLogin}
        className="h-10 w-10 rounded-lg border border-border bg-card text-primary shadow-sm transition-all hover:border-accent/40 hover:bg-secondary active:scale-[0.98] flex items-center justify-center"
      >
        {isLoggedIn ? <LogOut size={18} /> : <LogIn size={18} />}
      </button>
      <button
        type="button"
        title="즐겨찾기"
        onClick={onToggleFavorite}
        className={`h-10 w-10 rounded-lg border shadow-sm transition-all hover:border-accent/40 active:scale-[0.98] flex items-center justify-center ${
          isFavorite
            ? "border-amber-200 bg-amber-50 text-amber-500"
            : "border-border bg-card text-primary hover:bg-secondary"
        }`}
      >
        <Star size={18} className={isFavorite ? "fill-amber-400" : ""} />
      </button>
      <button
        type="button"
        title={isDarkMode ? "라이트 모드" : "다크 모드"}
        onClick={onToggleTheme}
        className="h-10 w-10 rounded-lg border border-border bg-card text-primary shadow-sm transition-all hover:border-accent/40 hover:bg-secondary active:scale-[0.98] flex items-center justify-center"
      >
        {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </div>
  );
}
