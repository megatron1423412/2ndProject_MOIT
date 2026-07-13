import { Bell, LogIn, LogOut, Moon, Star, Sun } from "lucide-react";
import IconButton from "../common/IconButton";
import type { PriceAlertNotification } from "../../features/smart-shopping/price-alerts/types";

interface TopActionBarProps {
  isLoggedIn: boolean;
  isDarkMode: boolean;
  isFavorite: boolean;
  onToggleLogin: () => void;
  onToggleTheme: () => void;
  onToggleFavorite: () => void;
  onOpenNotifications: () => void;
  priceNotifications?: PriceAlertNotification[];
}

export default function TopActionBar({
  isLoggedIn,
  isDarkMode,
  isFavorite,
  onToggleLogin,
  onToggleTheme,
  onToggleFavorite,
  onOpenNotifications,
  priceNotifications = [],
}: TopActionBarProps) {
  const unreadCount = priceNotifications.filter((notification) => !notification.read).length;
  return (
    <div className="relative flex items-center gap-2">
      <div className="relative"><IconButton label="알림" onClick={onOpenNotifications}><Bell size={18} /></IconButton>{unreadCount > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-black text-destructive-foreground">{unreadCount}</span>}</div>
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
