import React from "react";
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
  priceNotifications?: PriceAlertNotification[];
  onMarkPriceNotificationRead?: (notificationId: string) => void;
}

export default function TopActionBar({
  isLoggedIn,
  isDarkMode,
  isFavorite,
  onToggleLogin,
  onToggleTheme,
  onToggleFavorite,
  priceNotifications = [],
  onMarkPriceNotificationRead,
}: TopActionBarProps) {
  const unreadCount = priceNotifications.filter((notification) => !notification.read).length;
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  return (
    <div className="relative flex items-center gap-2">
      <div className="relative"><IconButton label="알림" onClick={() => setIsNotificationsOpen((value) => !value)}><Bell size={18} /></IconButton>{unreadCount > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-black text-destructive-foreground">{unreadCount}</span>}{isNotificationsOpen && <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-border bg-card p-3 shadow-xl"><p className="text-xs font-black text-primary">가격 알림</p>{priceNotifications.length === 0 ? <p className="mt-2 text-xs text-muted-foreground">새 가격 알림이 없습니다.</p> : <div className="mt-2 max-h-72 space-y-2 overflow-y-auto">{priceNotifications.map((notification) => <button key={notification.id} type="button" onClick={() => { onMarkPriceNotificationRead?.(notification.id); if (notification.purchaseLink) window.open(notification.purchaseLink, "_blank", "noopener,noreferrer"); }} className={`w-full rounded-lg border p-2 text-left text-xs ${notification.read ? "border-border text-muted-foreground" : "border-accent/40 bg-accent/5 text-primary"}`}><p className="font-bold">{notification.message}</p><p className="mt-1 text-[10px] text-muted-foreground">{notification.purchaseLink ? "클릭하여 구매 링크 확인" : "구매 링크 정보 없음"}</p></button>)}</div>}</div>}</div>
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
