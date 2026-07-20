import React, { useEffect, useMemo, useState } from "react";
import type { SubCategoryId, TopActionState } from "./types/moit";
import ChatScreen from "./components/features/chat/ChatScreen";
import MainStartScreen from "./components/features/start/MainStartScreen";
import { currentUser } from "./features/smart-shopping/user/userProfile";
import { LocalStoragePriceAlertRepository } from "./features/smart-shopping/price-alerts/LocalStoragePriceAlertRepository";
import type { PriceAlert, PriceAlertDraft, PriceAlertNotification } from "./features/smart-shopping/price-alerts/types";
import { LocalFavoriteRepository } from "./features/favorites/LocalFavoriteRepository";
import FavoritesPage from "./features/favorites/FavoritesPage";
import NotificationsPage from "./features/notifications/NotificationsPage";

export default function App() {
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<SubCategoryId | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [utilityPage, setUtilityPage] = useState<"favorites" | "notifications" | null>(null);
  const alertRepository = useMemo(() => new LocalStoragePriceAlertRepository(), []);
  const favoriteRepository = useMemo(() => new LocalFavoriteRepository(), []);
  const [priceNotifications, setPriceNotifications] = useState<PriceAlertNotification[]>(() => alertRepository.getNotificationsForUser(currentUser.id));
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>(() => alertRepository.getAlertsForUser(currentUser.id));
  const [favoritesRevision, setFavoritesRevision] = useState(0);
  const favorites = useMemo(() => favoriteRepository.getFavoritesForUser(currentUser.id), [favoriteRepository, favoritesRevision]);
  const handleToggleFavoriteProduct = (productId: string, draft: any) => {
    const existing = favorites.find(f => f.productId === productId);
    if (existing) {
      favoriteRepository.removeFavorite(existing.id);
    } else {
      favoriteRepository.addFavorite(draft);
    }
    setFavoritesRevision(prev => prev + 1);
  };
  const refreshAlerts = () => {
    setPriceAlerts(alertRepository.getAlertsForUser(currentUser.id));
    setPriceNotifications(alertRepository.getNotificationsForUser(currentUser.id));
  };
  useEffect(() => {
    if (!utilityPage || typeof window === "undefined") return;
    window.history.pushState({ ...(window.history.state ?? {}), moitUtilityPage: utilityPage }, "");
    const closeOnBrowserBack = () => setUtilityPage(null);
    window.addEventListener("popstate", closeOnBrowserBack);
    return () => window.removeEventListener("popstate", closeOnBrowserBack);
  }, [utilityPage]);
  const closeUtilityPage = () => {
    if (typeof window !== "undefined" && window.history.state?.moitUtilityPage) window.history.back();
    else setUtilityPage(null);
  };
  const createPriceAlert = (draft: PriceAlertDraft) => {
    const alert = alertRepository.createAlert(draft);
    alertRepository.evaluateAlerts(draft.userId, [{ productId: alert.productId, currentPrice: alert.currentPrice }]);
    refreshAlerts();
    return alert;
  };

  const appActions: TopActionState = {
    isLoggedIn,
    isDarkMode,
    isFavorite: favorites.length > 0,
    onToggleLogin: () => setIsLoggedIn((value) => !value),
    onToggleTheme: () => setIsDarkMode((value) => !value),
    onToggleFavorite: () => setUtilityPage("favorites"),
    onOpenNotifications: () => setUtilityPage("notifications"),
    priceNotifications,
    onMarkPriceNotificationRead: (notificationId) => {
      alertRepository.markNotificationRead(notificationId);
      refreshAlerts();
    },
  };

  return (
    <>
      <style>{`
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(26, 58, 92, 0.16);
          border-radius: 9999px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(26, 58, 92, 0.26);
        }
        body {
          margin: 0;
          padding: 0;
          overflow: hidden;
          background-color: #F2F6FC;
        }
      `}</style>
      <div className={isDarkMode ? "dark" : ""}>
        {selectedSubCategoryId ? (
          <ChatScreen
            subCategoryId={selectedSubCategoryId}
            onBack={() => setSelectedSubCategoryId(null)}
            onEndSmartShoppingChat={() => setSelectedSubCategoryId(null)}
            onCreatePriceAlert={createPriceAlert}
            onSelectSubCategory={(item) => setSelectedSubCategoryId(item.id)}
            actions={appActions}
            userProfile={currentUser}
            favorites={favorites}
            onToggleFavoriteProduct={handleToggleFavoriteProduct}
          />
        ) : (
          <MainStartScreen
            actions={appActions}
            onSelectSubCategory={(item) => setSelectedSubCategoryId(item.id)}
          />
        )}
        {utilityPage === "favorites" && <FavoritesPage favorites={favorites} alerts={priceAlerts} onBack={closeUtilityPage} onDelete={(favoriteId) => { favoriteRepository.removeFavorite(favoriteId); setFavoritesRevision((value) => value + 1); }} onCreatePriceAlert={createPriceAlert} />}
        {utilityPage === "notifications" && <NotificationsPage notifications={priceNotifications} alerts={priceAlerts} onBack={closeUtilityPage} onMarkRead={(notificationId) => { alertRepository.markNotificationRead(notificationId); refreshAlerts(); }} onDelete={(notificationId) => { alertRepository.deleteNotification(notificationId); refreshAlerts(); }} />}
      </div>
    </>
  );
}
