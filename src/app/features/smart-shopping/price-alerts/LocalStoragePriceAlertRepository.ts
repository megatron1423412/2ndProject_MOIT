import type { PriceAlertRepository } from "./PriceAlertRepository";
import type { PriceAlert, PriceAlertDraft, PriceAlertNotification } from "./types";

const ALERTS_KEY = "moit-price-alerts";
const NOTIFICATIONS_KEY = "moit-price-alert-notifications";
const read = <T,>(key: string): T[] => {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(window.localStorage.getItem(key) ?? "[]") as T[]; } catch { return []; }
};
const write = <T,>(key: string, values: T[]) => { if (typeof window !== "undefined") window.localStorage.setItem(key, JSON.stringify(values)); };

/** 프로토타입 localStorage adapter. 실제 서버 저장소로 교체할 수 있습니다. */
export class LocalStoragePriceAlertRepository implements PriceAlertRepository {
  createAlert(draft: PriceAlertDraft): PriceAlert {
    const now = new Date().toISOString();
    const alert: PriceAlert = { ...draft, id: `price-alert-${Date.now()}`, createdAt: now, lastCheckedAt: now, notified: false };
    write(ALERTS_KEY, [...read<PriceAlert>(ALERTS_KEY), alert]);
    return alert;
  }
  getAlertsForUser(userId: string) { return read<PriceAlert>(ALERTS_KEY).filter((alert) => alert.userId === userId); }
  getNotificationsForUser(userId: string) { return read<PriceAlertNotification>(NOTIFICATIONS_KEY).filter((notification) => notification.id.startsWith(`${userId}:`)); }
  updateAlert(alert: PriceAlert) { const alerts = read<PriceAlert>(ALERTS_KEY).map((item) => item.id === alert.id ? alert : item); write(ALERTS_KEY, alerts); return alert; }
  evaluateAlerts(userId: string, currentPrices: Array<{ productId: string; currentPrice: number }>) {
    const priceMap = new Map(currentPrices.map((item) => [item.productId, item.currentPrice]));
    const alerts = read<PriceAlert>(ALERTS_KEY);
    const notifications = read<PriceAlertNotification>(NOTIFICATIONS_KEY);
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
    write(ALERTS_KEY, updated); write(NOTIFICATIONS_KEY, notifications);
    return created;
  }
  markNotificationRead(notificationId: string) { write(NOTIFICATIONS_KEY, read<PriceAlertNotification>(NOTIFICATIONS_KEY).map((item) => item.id === notificationId ? { ...item, read: true } : item)); }
}
