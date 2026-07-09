import React from "react";
import { Bell, LogIn, LogOut, Moon, Star, Sun } from "lucide-react";
import IconButton from "../common/IconButton";

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
      <IconButton label="알림">
        <Bell size={18} />
      </IconButton>
      <IconButton label={isLoggedIn ? "로그아웃" : "로그인"} onClick={onToggleLogin}>
        {isLoggedIn ? <LogOut size={18} /> : <LogIn size={18} />}
      </IconButton>
      <IconButton label="즐겨찾기" active={isFavorite} onClick={onToggleFavorite}>
        <Star size={18} className={isFavorite ? "fill-amber-400" : ""} />
      </IconButton>
      <IconButton label={isDarkMode ? "라이트 모드" : "다크 모드"} onClick={onToggleTheme}>
        {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
      </IconButton>
    </div>
  );
}
