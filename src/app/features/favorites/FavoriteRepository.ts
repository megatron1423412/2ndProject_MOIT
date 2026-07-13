import type { FavoriteDraft, FavoriteProduct } from "./types";

export interface FavoriteRepository {
  getFavoritesForUser(userId: string): FavoriteProduct[];
  addFavorite(draft: FavoriteDraft): FavoriteProduct;
  removeFavorite(favoriteId: string): void;
  isFavorite(userId: string, productIdentity: string): boolean;
}
