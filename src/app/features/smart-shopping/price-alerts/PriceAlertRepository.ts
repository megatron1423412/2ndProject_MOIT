import type { PriceAlert, PriceAlertDraft, PriceAlertNotification } from "./types";

export interface PriceAlertRepository {
  createAlert(draft: PriceAlertDraft): PriceAlert;
  getAlertsForUser(userId: string): PriceAlert[];
  getNotificationsForUser(userId: string): PriceAlertNotification[];
  updateAlert(alert: PriceAlert): PriceAlert;
  evaluateAlerts(userId: string, currentPrices: Array<{ productId: string; currentPrice: number }>): PriceAlertNotification[];
  markNotificationRead(notificationId: string): void;
}
