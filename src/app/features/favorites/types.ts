import type { ProductCategoryId } from "../product-catalog/core/types";
import type { SelectedShoppingProduct } from "../smart-shopping/types/recommendation";

export interface FavoriteProduct {
  id: string;
  userId: string;
  productId: string;
  source: "internal" | "naver";
  categoryId: ProductCategoryId;
  name: string;
  brand: string;
  modelNumber?: string;
  imagePath: string;
  currentPrice: number;
  allTimeLow?: number;
  purchaseLink?: string;
  internalProductId?: string;
  selectedProduct?: SelectedShoppingProduct;
  dataStatus: "mock" | "naver-candidate";
  createdAt: string;
  lastCheckedAt: string;
}

export type FavoriteDraft = Omit<FavoriteProduct, "id" | "createdAt" | "lastCheckedAt">;
