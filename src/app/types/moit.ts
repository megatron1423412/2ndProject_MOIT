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
  initialMessage: string;
  quickReplies: string[];
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

export interface ProductDiagnosisResult {
  type: "product";
  headline: string;
  valueGrade: string;
  fairPrice: string;
  marketSignal: string;
  reviewSignal: string;
  fitSignal: string;
  nextChecks: string[];
}

export interface LivingCostDiagnosisResult {
  type: "living";
  headline: string;
  monthlySavings: number;
  yearlySavings: number;
  grade: string;
  checks: string[];
  caution: string;
}

export type DiagnosisResult = ProductDiagnosisResult | LivingCostDiagnosisResult;

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
  isFavorite: boolean;
  onToggleLogin: () => void;
  onToggleTheme: () => void;
  onToggleFavorite: () => void;
}
