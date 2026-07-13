export interface PriceAlert {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  modelNumber?: string;
  source: "internal" | "naver";
  purchaseLink?: string;
  currentPrice: number;
  targetPrice: number;
  active: boolean;
  createdAt: string;
  lastCheckedAt: string;
  notified: boolean;
}

export interface PriceAlertNotification {
  id: string;
  alertId: string;
  productName: string;
  message: string;
  purchaseLink?: string;
  createdAt: string;
  read: boolean;
}

export type PriceAlertDraft = Omit<PriceAlert, "id" | "createdAt" | "lastCheckedAt" | "notified">;
