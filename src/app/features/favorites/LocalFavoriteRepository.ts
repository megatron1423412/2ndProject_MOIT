import type { FavoriteRepository } from "./FavoriteRepository";
import type { FavoriteDraft, FavoriteProduct } from "./types";
import { getFavoriteProductIdentity } from "./favoriteIdentity";

export const FAVORITES_STORAGE_KEY = "moit-favorite-products";
const read = (): FavoriteProduct[] => {
  if (typeof window === "undefined") return [];
  try { const value = JSON.parse(window.localStorage.getItem(FAVORITES_STORAGE_KEY) ?? "[]"); return Array.isArray(value) ? value : []; } catch { return []; }
};
const write = (items: FavoriteProduct[]) => { if (typeof window !== "undefined") window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(items)); };
/** localStorage prototype adapter; a server repository can replace this boundary later. */
export class LocalFavoriteRepository implements FavoriteRepository {
  getFavoritesForUser(userId: string) { return read().filter((favorite) => favorite.userId === userId); }
  addFavorite(draft: FavoriteDraft) {
    const items = read();
    const identity = getFavoriteProductIdentity(draft);
    const existing = items.find((item) => item.userId === draft.userId && getFavoriteProductIdentity(item) === identity);
    if (existing) return existing;
    const now = new Date().toISOString();
    const favorite: FavoriteProduct = { ...draft, id: `favorite-${Date.now()}`, createdAt: now, lastCheckedAt: now };
    write([...items, favorite]);
    return favorite;
  }
  removeFavorite(favoriteId: string) { write(read().filter((favorite) => favorite.id !== favoriteId)); }
  isFavorite(userId: string, productIdentity: string) { return this.getFavoritesForUser(userId).some((favorite) => getFavoriteProductIdentity(favorite) === productIdentity); }
}
