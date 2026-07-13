import type { PriceAlertRepository } from "./PriceAlertRepository";
import type { PriceAlert, PriceAlertDraft, PriceAlertNotification } from "./types";

export const PRICE_ALERTS_STORAGE_KEY = "moit-price-alerts";
export const PRICE_ALERT_NOTIFICATIONS_STORAGE_KEY = "moit-price-alert-notifications";
const read = <T,>(key: string): T[] => {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(window.localStorage.getItem(key) ?? "[]") as T[]; } catch { return []; }
};
const write = <T,>(key: string, values: T[]) => { if (typeof window !== "undefined") window.localStorage.setItem(key, JSON.stringify(values)); };

/** 프로토타입 localStorage adapter. 실제 서버 저장소로 교체할 수 있습니다. */
export class LocalStoragePriceAlertRepository implements PriceAlertRepository {
  createAlert(draft: PriceAlertDraft): PriceAlert {
    const now = new Date().toISOString();
    const existing = read<PriceAlert>(PRICE_ALERTS_STORAGE_KEY).find((alert) => alert.userId === draft.userId && alert.productId === draft.productId && alert.active);
    if (existing) {
      const updated: PriceAlert = { ...existing, ...draft, id: existing.id, createdAt: existing.createdAt, lastCheckedAt: now, notified: false };
      this.updateAlert(updated);
      return updated;
    }
    const alert: PriceAlert = { ...draft, id: `price-alert-${Date.now()}`, createdAt: now, lastCheckedAt: now, notified: false };
    write(PRICE_ALERTS_STORAGE_KEY, [...read<PriceAlert>(PRICE_ALERTS_STORAGE_KEY), alert]);
    return alert;
  }
  getAlertsForUser(userId: string) { return read<PriceAlert>(PRICE_ALERTS_STORAGE_KEY).filter((alert) => alert.userId === userId); }
  getNotificationsForUser(userId: string) { return read<PriceAlertNotification>(PRICE_ALERT_NOTIFICATIONS_STORAGE_KEY).filter((notification) => notification.id.startsWith(`${userId}:`)); }
  updateAlert(alert: PriceAlert) { const alerts = read<PriceAlert>(PRICE_ALERTS_STORAGE_KEY).map((item) => item.id === alert.id ? alert : item); write(PRICE_ALERTS_STORAGE_KEY, alerts); return alert; }
  evaluateAlerts(userId: string, currentPrices: Array<{ productId: string; currentPrice: number }>) {
    const priceMap = new Map(currentPrices.map((item) => [item.productId, item.currentPrice]));
    const alerts = read<PriceAlert>(PRICE_ALERTS_STORAGE_KEY);
    const notifications = read<PriceAlertNotification>(PRICE_ALERT_NOTIFICATIONS_STORAGE_KEY);
    const created: PriceAlertNotification[] = [];
    const updated = alerts.map((alert) => {
      if (alert.userId !== userId || !alert.active) return alert;
      const currentPrice = priceMap.get(alert.productId);
      if (!currentPrice) return alert;
      const checked = { ...alert, currentPrice, lastCheckedAt: new Date().toISOString() };
      if (currentPrice <= alert.targetPrice && !alert.notified) {
        const notification: PriceAlertNotification = { id: `${userId}:${alert.id}:${Date.now()}`, alertId: alert.id, productName: alert.productName, purchaseLink: alert.purchaseLink, createdAt: checked.lastCheckedAt, read: false, message: `${alert.productName}의 가격이 설정하신 ${alert.targetPrice.toLocaleString("ko-KR")}원 이하로 내려갔어요.` };
        created.push(notification); notifications.push(notification); return { ...checked, notified: true };
      }
      return checked;
    });
    write(PRICE_ALERTS_STORAGE_KEY, updated); write(PRICE_ALERT_NOTIFICATIONS_STORAGE_KEY, notifications);
    return created;
  }
  markNotificationRead(notificationId: string) { write(PRICE_ALERT_NOTIFICATIONS_STORAGE_KEY, read<PriceAlertNotification>(PRICE_ALERT_NOTIFICATIONS_STORAGE_KEY).map((item) => item.id === notificationId ? { ...item, read: true } : item)); }
  deleteNotification(notificationId: string) { write(PRICE_ALERT_NOTIFICATIONS_STORAGE_KEY, read<PriceAlertNotification>(PRICE_ALERT_NOTIFICATIONS_STORAGE_KEY).filter((item) => item.id !== notificationId)); }
}
