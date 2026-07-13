import React from "react";
import BrandHeader from "./BrandHeader";
import TopActionBar from "./TopActionBar";
import type { PriceAlertNotification } from "../../features/smart-shopping/price-alerts/types";

interface PageShellProps {
  children: React.ReactNode;
  isLoggedIn: boolean;
  isDarkMode: boolean;
  isFavorite: boolean;
  onBrandClick?: () => void;
  onToggleLogin: () => void;
  onToggleTheme: () => void;
  onToggleFavorite: () => void;
  priceNotifications?: PriceAlertNotification[];
  onMarkPriceNotificationRead?: (notificationId: string) => void;
}

export default function PageShell({
  children,
  isLoggedIn,
  isDarkMode,
  isFavorite,
  onBrandClick,
  onToggleLogin,
  onToggleTheme,
  onToggleFavorite,
  priceNotifications,
  onMarkPriceNotificationRead,
}: PageShellProps) {
  return (
    <div className="h-screen w-screen overflow-y-auto bg-background text-foreground">
      <div className="mx-auto flex min-h-full w-full max-w-[1440px] flex-col px-5 py-5 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
          <BrandHeader onClick={onBrandClick} />
          <TopActionBar
            isLoggedIn={isLoggedIn}
            isDarkMode={isDarkMode}
            isFavorite={isFavorite}
            onToggleLogin={onToggleLogin}
            onToggleTheme={onToggleTheme}
            onToggleFavorite={onToggleFavorite}
            priceNotifications={priceNotifications}
            onMarkPriceNotificationRead={onMarkPriceNotificationRead}
          />
        </header>
        {children}
      </div>
    </div>
  );
}
