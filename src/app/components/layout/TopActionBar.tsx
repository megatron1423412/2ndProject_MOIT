import { Bell, LogIn, LogOut, Moon, Star, Sun } from "lucide-react";
import IconButton from "../common/IconButton";
import type { PriceAlertNotification } from "../../features/smart-shopping/price-alerts/types";

interface TopActionBarProps {
  isLoggedIn: boolean;
  isDarkMode: boolean;
  onToggleLogin: () => void;
  onToggleTheme: () => void;
  onToggleFavorite: () => void;
  onOpenNotifications: () => void;
  priceNotifications?: PriceAlertNotification[];
}

export default function TopActionBar({
  isLoggedIn,
  isDarkMode,
  onToggleLogin,
  onToggleTheme,
  onToggleFavorite,
  onOpenNotifications,
  priceNotifications = [],
}: TopActionBarProps) {
  const unreadCount = priceNotifications.filter((notification) => !notification.read).length;

  return (
    /* 🎨 [프론트엔드 수정 가능 Zone 1: 우측 상단 액션 바 버튼 간격]
       - gap-2: 각 버튼들 사이의 간격 (gap-1.5, gap-3 등)
    */
    <div className="relative flex items-center gap-0.5">
      
      {/* 🎨 [프론트엔드 수정 가능 Zone 2: 알림 버튼 영역]
         - 동그란 배경을 추가하고 싶다면 IconButton 태그나 감싸는 div에 
           className="rounded-full bg-slate-100 h-10 w-10 flex items-center justify-center" 형태로 지정 가능합니다.
      */}
      <div className="relative">
        <IconButton label="알림" onClick={onOpenNotifications}>
          <Bell size={18} />
        </IconButton>

        {/* 🎨 [프론트엔드 수정 가능 Zone 3: 안 읽은 알림 배지(뱃지) 스타일]
           - bg-destructive: 배지 배경색
           - text-destructive-foreground: 배지 텍스트 색상
           - text-[9px]: 배지 내부 숫자 크기
        */}
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-black text-destructive-foreground">
            {unreadCount}
          </span>
        )}
      </div>

      {/* 🎨 [프론트엔드 수정 가능 Zone 4: 로그인/로그아웃 버튼] */}
      <IconButton label={isLoggedIn ? "로그아웃" : "로그인"} onClick={onToggleLogin}>
        {isLoggedIn ? <LogOut size={18} /> : <LogIn size={18} />}
      </IconButton>

      {/* 🎨 [프론트엔드 수정 가능 Zone 5: 즐겨찾기 버튼] */}
      <IconButton label="즐겨찾기" onClick={onToggleFavorite}>
        <Star size={18} />
      </IconButton>

      {/* 🎨 [프론트엔드 수정 가능 Zone 6: 테마 변경(다크/라이트) 버튼] */}
      <IconButton label={isDarkMode ? "라이트 모드" : "다크 모드"} onClick={onToggleTheme}>
        {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
      </IconButton>
    </div>
  );
}