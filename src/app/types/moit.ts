export type StartSectionId = "smart-spending" | "living-cost";
export type MiddleCategoryId = "appliances" | "telecom";
export type SubCategoryId =
  | "air-conditioner"
  | "tv"
  | "refrigerator"
  | "vacuum"
  | "phone"
  | "internet"
  | "iptv"
  | "bundle";

export type DiagnosisKind = "product" | "living";
export type HistoryStatus = "완료" | "진행 중" | "다시 확인 필요";
export type IconKey =
  | "sparkles"
  | "appliance"
  | "telecom"
  | "snowflake"
  | "tv"
  | "refrigerator"
  | "vacuum"
  | "phone"
  | "internet"
  | "bundle";

export interface SubCategory {
  id: SubCategoryId;
  title: string;
  parentCategory: MiddleCategoryId;
  kind: DiagnosisKind;
  description: string;
  icon: IconKey;
  /** Replaceable public asset. Leave undefined to use the Lucide fallback only. */
  iconPath?: string;
  chatTitle: string;
}

export interface MiddleCategory {
  id: MiddleCategoryId;
  title: string;
  parentSection: StartSectionId;
  description: string;
  icon: IconKey;
  /** Replaceable public asset. Leave undefined to use the Lucide fallback only. */
  iconPath?: string;
  subCategories: SubCategory[];
}

export interface StartSection {
  id: StartSectionId;
  title: string;
  description: string;
  middleCategories: MiddleCategory[];
}

export interface ConversationHistoryItem {
  id: string;
  title: string;
  category: string;
  lastDate: string;
  summary: string;
  status: HistoryStatus;
}

export interface TopActionState {
  isLoggedIn: boolean;
  isDarkMode: boolean;
  onToggleLogin: () => void;
  onToggleTheme: () => void;
  onToggleFavorite: () => void;
  onOpenNotifications: () => void;
  priceNotifications?: import("../features/smart-shopping/price-alerts/types").PriceAlertNotification[];
  onMarkPriceNotificationRead?: (notificationId: string) => void;
}
