import React from "react";
import BrandHeader from "./BrandHeader";
import TopActionBar from "./TopActionBar";
import type { PriceAlertNotification } from "../../features/smart-shopping/price-alerts/types";

interface PageShellProps {
  children: React.ReactNode;
  isLoggedIn: boolean;
  isDarkMode: boolean;
  onBrandClick?: () => void;
  onToggleLogin: () => void;
  onToggleTheme: () => void;
  onToggleFavorite: () => void;
  onOpenNotifications: () => void;
  priceNotifications?: PriceAlertNotification[];
}

export default function PageShell({
  children,
  isLoggedIn,
  isDarkMode,
  onBrandClick,
  onToggleLogin,
  onToggleTheme,
  onToggleFavorite,
  onOpenNotifications,
  priceNotifications,
}: PageShellProps) {
  return (
    /* 🎨 [프론트엔드 수정 가능 Zone 1: 최상단 전체 앱 뷰포트 & 바탕 배경색]
       - h-screen w-screen: 전체 화면 가득 채움
       - overflow-y-auto: 세로 스크롤 허용
       - bg-background: 맨 뒤 바탕 배경색 👈 💡 [여기!] bg-[#F5F7FA] 나 bg-slate-50 등으로 교체하면 앱 전체 배경이 바뀝니다.
       - text-foreground: 기본 텍스트 색상
    */
    <div className="h-screen w-screen overflow-y-auto bg-[#f8fafc] text-foreground">
      
      {/* 🎨 [프론트엔드 수정 가능 Zone 2: 메인 컨테이너 최대 너비 및 바깥 여백]
         - max-w-[1440px]: 웹 화면 전체 최대 가로폭 (max-w-7xl, max-w-[1280px] 등)
         - px-5 py-5 lg:px-8: 전체 레이아웃의 상하좌우 패딩 여백
      */}
      <div className="mx-auto flex min-h-full w-full max-w-[1440px] flex-col px-5 py-5 lg:px-8">
        
        {/* 🎨 [프론트엔드 수정 가능 Zone 3: 상단 헤더(로고 + 액션버튼) 레이아웃]
           - pb-5: 헤더 내부 하단 여백
           - gap-4: 로고 영역과 우측 버튼들 사이의 간격
        */}
        {/* 💡 기존 구분선 코드 (주석 처리) */}
        {/* <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5"> */}
        
        {/* ✨ 구분선(border-b) 제거 적용 코드 */}
        <header className="flex flex-wrap items-center justify-between gap-4 pb-5">
          <BrandHeader onClick={onBrandClick} />
          <TopActionBar
            isLoggedIn={isLoggedIn}
            isDarkMode={isDarkMode}
            onToggleLogin={onToggleLogin}
            onToggleTheme={onToggleTheme}
            onToggleFavorite={onToggleFavorite}
            onOpenNotifications={onOpenNotifications}
            priceNotifications={priceNotifications}
          />
        </header>
        
        {/* 메인 컨텐츠 영역 (MainStartScreen 등) */}
        {children}
      </div>
    </div>
  );
}